use std::{
    meta::{type_of, unquote, typ::fresh_type_variable}, collections::umap::UHashMap,
    hash::{BuildHasherDefault, poseidon2::Poseidon2Hasher}
};
use protocol_types::meta::{flatten_to_fields, pack_from_fields};
use crate::note::{note_header::NoteHeader, note_getter_options::PropertySelector};

comptime global NOTE_HEADER_TYPE = type_of(NoteHeader::empty());

// A map from note type to (note_struct_definition, serialized_note_length, note_type_id, fields).
// `fields` is an array of tuples where each tuple contains the name of the field/struct member (e.g. `amount`
// in `TokenNote`), the index of where the serialized member starts in the serialized note and a flag indicating
// whether the field is nullable or not.
comptime mut global NOTES: UHashMap<Type, (StructDefinition, u32, Field, [(Quoted, u32, bool)]), BuildHasherDefault<Poseidon2Hasher>> = UHashMap::default();

comptime fn compute_note_type_id(name: Quoted) -> Field {
    let name_as_str_quote = name.as_str_quote();

    unquote!(
        quote {
            let bytes = $name_as_str_quote.as_bytes();
            let hash = protocol_types::hash::poseidon2_hash_bytes(bytes);
            let hash_bytes = hash.to_be_bytes::<4>();
            protocol_types::utils::field::field_from_bytes(hash_bytes, true)
        }
    )
}

comptime fn generate_note_interface(
    s: StructDefinition,
    note_type_id: Field,
    indexed_fixed_fields: [(Quoted, Type, u32)],
    indexed_nullable_fields: [(Quoted, Type, u32)]
) -> (Quoted, u32) {
    let name = s.name();
    let typ = s.as_type();

    // First we compute note content serialization. We do that by passing the whole note struct
    // to the `flatten_to_fields(...)` and omitting the header.
    let (content_fields_list, content_aux_vars_list) = flatten_to_fields(quote { self }, typ, &[quote {self.header}]);

    // If there are `aux_vars` we need to join them with `;` and add a trailing `;` to the joined string.
    let content_aux_vars = if content_aux_vars_list.len() > 0 {
        let joint = content_aux_vars_list.join(quote {;});
        quote { $joint; }
    } else {
        quote {}
    };
    let content_fields = content_fields_list.join(quote {,});
    let content_len = content_fields_list.len();

    let (deserialized_content, _) = pack_from_fields(
        quote { self },
        typ,
        quote { value },
        0,
        &[(quote {header}, quote { aztec::note::note_header::NoteHeader::empty() })]
    );

    // Second we compute quotes for MSM
    // `compute_note_hash()` is computed over all the fields so we need to merge fixed and nullable.
    let merged_fields = indexed_fixed_fields.append(indexed_nullable_fields);
    // Now we prefix each of the merged fields with `self.` since they refer to the struct members here.
    let prefixed_merged_fields = merged_fields.map(| (name, typ, index): (Quoted, Type, u32) | (quote { self.$name }, typ, index));
    let (new_generators_list, new_scalars_list, _, new_aux_vars) = generate_multi_scalar_mul(prefixed_merged_fields);

    let new_generators = new_generators_list.push_back(quote { aztec::generators::G_slot }).join(quote {,});
    let new_scalars = new_scalars_list.push_back(quote { std::hash::from_field_unsafe(self.header.storage_slot) }).join(quote {,});

    (quote {
        impl aztec::note::note_interface::NoteInterface<$content_len> for $name {
            fn to_be_bytes(self, storage_slot: Field) -> [u8; $content_len * 32 + 64] {
                let serialized_note = self.serialize_content();

                let mut buffer: [u8; $content_len * 32 + 64] = [0; $content_len * 32 + 64];

                let storage_slot_bytes: [u8; 32] = storage_slot.to_be_bytes();
                let note_type_id_bytes: [u8; 32] = $name::get_note_type_id().to_be_bytes();

                for i in 0..32 {
                    buffer[i] = storage_slot_bytes[i];
                    buffer[32 + i] = note_type_id_bytes[i];
                }

                for i in 0..serialized_note.len() {
                    let bytes: [u8; 32] = serialized_note[i].to_be_bytes();
                    for j in 0..32 {
                        buffer[64 + i * 32 + j] = bytes[j];
                    }
                }
                buffer
            }

            fn deserialize_content(value: [Field; $content_len]) -> Self {
                $deserialized_content
            }

            fn serialize_content(self) -> [Field; $content_len] {
                $content_aux_vars
                [$content_fields]
            }

            fn get_note_type_id() -> Field {
                $note_type_id
            }

            fn set_header(&mut self, header: $NOTE_HEADER_TYPE) {
                self.header = header;
            }

            fn get_header(self) -> $NOTE_HEADER_TYPE {
                self.header
            }

            fn compute_note_hash(self) -> Field {
                $new_aux_vars
                let point = std::embedded_curve_ops::multi_scalar_mul(
                    [$new_generators],
                    [$new_scalars]
                );
                point.x
            }
        }
    }, content_len)
}

comptime fn generate_note_properties(s: StructDefinition) -> Quoted {
    let name = s.name();

    let struct_name = f"{name}Properties".quoted_contents();

    let property_selector_type = type_of(PropertySelector { index: 0, offset: 0, length: 0 });
    let note_header_type: Type = type_of(NoteHeader::empty());

    let non_header_fields = s.fields().filter(| (_, typ): (Quoted, Type) | typ != note_header_type);

    let properties_types = non_header_fields.map(
        | (name, _): (Quoted, Type) | {
           quote { $name: $property_selector_type }
        }
    ).join(quote {,});

    // TODO #8694: Properly handle non-field types https://github.com/AztecProtocol/aztec-packages/issues/8694
    let mut properties_list = &[];
    for i in 0..non_header_fields.len() {
        let (name, _) = non_header_fields[i];
        properties_list = properties_list.push_back(quote { $name: aztec::note::note_getter_options::PropertySelector { index: $i, offset: 0, length: 32 } });
    }

    let properties = properties_list.join(quote {,});

    quote {
        struct $struct_name {
            $properties_types
        }

        impl aztec::note::note_interface::NoteProperties<$struct_name> for $name {
            fn properties() -> $struct_name {
                $struct_name {
                    $properties
                }
            }
        }
    }
}

/// Generates note export for a given note struct. The export is a global variable that contains note type id,
/// note name and information about note fields (field name, index and whether the field is nullable or not).
pub(crate) comptime fn generate_note_export(
    s: StructDefinition,
    note_type_id: Field,
    fields: [(Quoted, u32, bool)]
) -> Quoted {
    let name = s.name();
    let mut hasher = Poseidon2Hasher::default();
    s.as_type().hash(&mut hasher);
    let hash = hasher.finish() as u32;
    let global_export_name = f"{name}_{hash}_EXPORTS".quoted_contents();
    let note_fields_name = f"{name}Fields_{hash}".quoted_contents();
    let note_name_as_str = name.as_str_quote();
    let note_name_str_len = unquote!(quote { $note_name_as_str.as_bytes().len() });

    let mut note_fields = &[];
    let mut note_field_constructors = &[];
    for field in fields {
        let (name, index, nullable) = field;
        note_fields = note_fields.push_back(quote { $name: aztec::note::note_field::NoteField });
        note_field_constructors = note_field_constructors.push_back(quote { $name: aztec::note::note_field::NoteField { index: $index, nullable: $nullable }});
    }

    let note_fields = note_fields.join(quote {,});
    let note_field_constructors = note_field_constructors.join(quote {,});

    quote {
        struct $note_fields_name {
            $note_fields
        }

        #[abi(notes)]
        global $global_export_name: (Field, str<$note_name_str_len>, $note_fields_name) = ($note_type_id,$note_name_as_str, $note_fields_name { $note_field_constructors });
    }
}

comptime fn generate_multi_scalar_mul(indexed_fields: [(Quoted, Type, u32)]) -> ([Quoted], [Quoted], [Quoted], Quoted) {
    let mut generators_list = &[];
    let mut scalars_list = &[];
    let mut args_list = &[];
    let mut aux_vars_list = &[];
    // TODO(#8648): Generate generators at comptime instead of importing here.
    for i in 0..indexed_fields.len() {
        let (field_name, typ, index) = indexed_fields[i];
        let start_generator_index = index + 1;
        let (flattened_field, aux_vars) = flatten_to_fields(field_name, typ, &[]);
        for j in 0..flattened_field.len() {
            let flattened_as_field = flattened_field[j];
            let generator_index = start_generator_index + j;
            generators_list = generators_list.push_back(f"aztec::generators::Ga{generator_index}".quoted_contents());
            scalars_list = scalars_list.push_back(quote { std::hash::from_field_unsafe($flattened_as_field) });
        }
        args_list = args_list.push_back(quote { $field_name: $typ });
        aux_vars_list = aux_vars_list.append(aux_vars);
    }

    let aux_vars = if aux_vars_list.len() > 0 {
        let joint = aux_vars_list.join(quote {;});
        quote { $joint; }
    } else {
        quote {}
    };
    (generators_list, scalars_list, args_list, aux_vars)
}

comptime fn generate_setup_payload(
    s: StructDefinition,
    indexed_fixed_fields: [(Quoted, Type, u32)],
    indexed_nullable_fields: [(Quoted, Type, u32)]
) -> (Quoted, Quoted) {
    let name = s.name();
    let setup_payload_name = f"{name}SetupPayload".quoted_contents();

    // First we get the MSM related quotes
    let (new_generators_list, new_scalars_list, new_args_list, new_aux_vars) = generate_multi_scalar_mul(indexed_fixed_fields);
    let new_args = &[quote {mut self}].append(new_args_list).push_back(quote { storage_slot: Field }).join(quote {,});
    let new_generators = new_generators_list.push_back(quote { aztec::generators::G_slot }).join(quote {,});
    let new_scalars = new_scalars_list.push_back(quote { std::hash::from_field_unsafe(storage_slot) }).join(quote {,});

    // Then the log plaintext ones
    let log_plaintext_length = indexed_fixed_fields.len() * 32 + 64;
    let setup_log_plaintext = get_setup_log_plaintext_body(s, log_plaintext_length, indexed_nullable_fields);

    (quote {
        struct $setup_payload_name {
            log_plaintext: [u8; $log_plaintext_length],
            hiding_point: aztec::protocol_types::point::Point
        }

        impl $setup_payload_name {
            fn new($new_args) -> $setup_payload_name {
                $new_aux_vars
                let hiding_point = std::embedded_curve_ops::multi_scalar_mul(
                    [$new_generators],
                    [$new_scalars]
                );
                $setup_log_plaintext

                $setup_payload_name {
                    log_plaintext,
                    hiding_point
                }
            }
        }

        impl aztec::protocol_types::traits::Empty for $setup_payload_name {
            fn empty() -> Self {
                Self { log_plaintext: [0; $log_plaintext_length], hiding_point: aztec::protocol_types::point::Point::empty() }
            }
        }
    }, setup_payload_name)
}

comptime fn get_setup_log_plaintext_body(
    s: StructDefinition,
    log_plaintext_length: u32,
    indexed_nullable_fields: [(Quoted, Type, u32)]
) -> Quoted {
    let name = s.name();

    // Now we compute serialization of the fixed fields. We do that by passing the whole note struct
    // to the flatten_to_fields function but we omit the NoteHeader and the nullable fields.
    let to_omit = indexed_nullable_fields.map(| (name, _, _): (Quoted, Type, u32) | name).push_back(quote { header });
    let (fields_list, aux_vars) = flatten_to_fields(quote { }, s.as_type(), to_omit);

    // If there are `aux_vars` we need to join them with `;` and add a trailing `;` to the joined string.
    let aux_vars_for_serialization = if aux_vars.len() > 0 {
        let joint = aux_vars.join(quote {;});
        quote { $joint; }
    } else {
        quote {}
    };
    let fields = fields_list.join(quote {,});

    quote {
        let mut log_plaintext: [u8; $log_plaintext_length] = [0; $log_plaintext_length];

        let storage_slot_bytes: [u8; 32] = storage_slot.to_be_bytes();
        let note_type_id_bytes: [u8; 32] = $name::get_note_type_id().to_be_bytes();

        for i in 0..32 {
            log_plaintext[i] = storage_slot_bytes[i];
            log_plaintext[32 + i] = note_type_id_bytes[i];
        }

        $aux_vars_for_serialization
        let serialized_note = [$fields];

        for i in 0..serialized_note.len() {
            let bytes: [u8; 32] = serialized_note[i].to_be_bytes();
            for j in 0..32 {
                log_plaintext[64 + i * 32 + j] = bytes[j];
            }
        }
    }
}

comptime fn generate_finalization_payload(
    s: StructDefinition,
    indexed_fixed_fields: [(Quoted, Type, u32)],
    indexed_nullable_fields: [(Quoted, Type, u32)]
) -> (Quoted, Quoted) {
    let name = s.name();
    let finalization_payload_name = f"{name}FinalizationPayload".quoted_contents();

    // We compute serialization of the nullable fields which are to be emitted as an unencrypted log. We do that by
    // passing the whole note struct to the `flatten_to_fields(...)` function but we omit the `NoteHeader` and
    // the fixed fields.
    let to_omit = indexed_fixed_fields.map(| (name, _, _): (Quoted, Type, u32) | name).push_back(quote { header });
    let (fields_list, aux_vars) = flatten_to_fields(quote { }, s.as_type(), to_omit);

    // If there are `aux_vars` we need to join them with `;` and add a trailing `;` to the joined string.
    let aux_vars_for_serialization = if aux_vars.len() > 0 {
        let joint = aux_vars.join(quote {;});
        quote { $joint; }
    } else {
        quote {}
    };

    // We compute the log length and we concatenate the fields into a single quote.
    let log_length = fields_list.len();
    let fields = fields_list.join(quote {,});

    // Now we compute quotes relevant to the multi-scalar multiplication.
    let (generators_list, scalars_list, args_list, msm_aux_vars) = generate_multi_scalar_mul(indexed_nullable_fields);

    let generators = generators_list.join(quote {,});
    let scalars = scalars_list.join(quote {,});
    let args = args_list.join(quote {,});

    (quote {
        struct $finalization_payload_name {
            log: [Field; $log_length],
            note_hash: Field,
        }

        impl $finalization_payload_name {
            fn new(mut self, hiding_point: aztec::protocol_types::point::Point, $args) -> $finalization_payload_name {
                $aux_vars_for_serialization
                self.log = [$fields];

                $msm_aux_vars
                let finalization_hiding_point = std::embedded_curve_ops::multi_scalar_mul(
                    [$generators],
                    [$scalars]
                ) + hiding_point;

                self.note_hash = finalization_hiding_point.x;
                self
            }
        }

        impl aztec::protocol_types::traits::Empty for $finalization_payload_name {
            fn empty() -> Self {
                Self { log: [0; $log_length], note_hash: 0 }
            }
        }
    }, finalization_payload_name)
}

comptime fn generate_partial_note_impl(
    s: StructDefinition,
    setup_payload_name: Quoted,
    finalization_payload_name: Quoted
) -> Quoted {
    let name = s.name();
    quote {
        impl aztec::note::note_interface::PartialNote<$setup_payload_name, $finalization_payload_name> for $name {
            fn setup_payload() -> $setup_payload_name {
                $setup_payload_name::empty()
            }

            fn finalization_payload() -> $finalization_payload_name {
                $finalization_payload_name::empty()
            }
        }
    }
}

comptime fn register_note(
    note: StructDefinition,
    note_serialized_len: u32,
    note_type_id: Field,
    fixed_fields: [(Quoted, Type, u32)],
    nullable_fields: [(Quoted, Type, u32)]
) {
    let mut fields = &[];
    for field in fixed_fields {
        let (name, _, index) = field;
        fields = fields.push_back((name, index, false));
    }
    for field in nullable_fields {
        let (name, _, index) = field;
        fields = fields.push_back((name, index, true));
    }

    NOTES.insert(
        note.as_type(),
        (note, note_serialized_len, note_type_id, fields)
    );
}

/// Separates note struct members into fixed and nullable ones. It also stores the index of where each struct member
/// starts in the serialized note. Note that each struct member can occupy multiple fields (as in Field type).
/// An example of a struct member occupying multiple fields is `amount` in `TokenNote` that uses `U128` type.
comptime fn index_note_fields(
    s: StructDefinition,
    nullable_fields: [Quoted]
) -> ([(Quoted, Type, u32)], [(Quoted, Type, u32)]) {
    let mut indexed_fixed_fields: [(Quoted, Type, u32)] = &[];
    let mut indexed_nullable_fields = &[];
    let mut counter: u32 = 0;
    for field in s.fields() {
        let (name, typ) = field;
        if (typ != NOTE_HEADER_TYPE) {
            if nullable_fields.all(| field | field != name) {
                indexed_fixed_fields = indexed_fixed_fields.push_back((name, typ, counter));
            } else {
                indexed_nullable_fields = indexed_nullable_fields.push_back((name, typ, counter));
            }
        }
        let (flattened, _) = flatten_to_fields(name, typ, &[]);
        // Each struct member can occupy multiple fields so we need to increment the counter accordingly
        counter+=flattened.len();
    }
    (indexed_fixed_fields, indexed_nullable_fields)
}

comptime fn common_note_annotation(s: StructDefinition) -> (Quoted, Field) {
    // Automatically inject header if not present
    let filtered_header = s.fields().filter(| (_, typ): (Quoted, Type) | typ == NOTE_HEADER_TYPE);
    if (filtered_header.len() == 0) {
        let new_fields = s.fields().push_back((quote { header }, NOTE_HEADER_TYPE));
        s.set_fields(new_fields);
    }
    let note_properties = generate_note_properties(s);
    let note_type_id = compute_note_type_id(s.name());

    (quote {
        $note_properties
    }, note_type_id)
}

#[varargs]
pub comptime fn partial_note(s: StructDefinition, nullable_fields: [Quoted]) -> Quoted {
    // We separate struct members into fixed ones and nullable ones and we store info about the start index of each
    // member in the serialized note array.
    let (indexed_fixed_fields, indexed_nullable_fields) = index_note_fields(s, nullable_fields);

    let (common, note_type_id) = common_note_annotation(s);
    let (setup_payload_impl, setup_payload_name) = generate_setup_payload(s, indexed_fixed_fields, indexed_nullable_fields);
    let (finalization_payload_impl, finalization_payload_name) = generate_finalization_payload(s, indexed_fixed_fields, indexed_nullable_fields);
    let (note_interface_impl, note_serialized_len) = generate_note_interface(s, note_type_id, indexed_fixed_fields, indexed_nullable_fields);
    let partial_note_impl = generate_partial_note_impl(s, setup_payload_name, finalization_payload_name);
    register_note(
        s,
        note_serialized_len,
        note_type_id,
        indexed_fixed_fields,
        indexed_nullable_fields
    );

    quote {
        $common
        $setup_payload_impl
        $finalization_payload_impl
        $note_interface_impl
        $partial_note_impl
    }
}

pub comptime fn note(s: StructDefinition) -> Quoted {
    let (indexed_fixed_fields, indexed_nullable_fields) = index_note_fields(s, &[]);
    let (common, note_type_id) = common_note_annotation(s);
    let (note_interface_impl, note_serialized_len) = generate_note_interface(s, note_type_id, indexed_fixed_fields, indexed_nullable_fields);
    register_note(
        s,
        note_serialized_len,
        note_type_id,
        indexed_fixed_fields,
        indexed_nullable_fields
    );

    quote {
        $common
        $note_interface_impl
    }
}

pub comptime fn note_custom_interface(s: StructDefinition) -> Quoted {
    let (common, note_type_id) = common_note_annotation(s);
    let serialized_len_type = fresh_type_variable();
    let note_interface_impl = s.as_type().get_trait_impl(quote { crate::note::note_interface::NoteInterface<$serialized_len_type> }.as_trait_constraint());
    let name = s.name();

    let note_serialized_len = note_interface_impl.expect(f"Note {name} must implement NoteInterface trait").trait_generic_args()[0].as_constant().unwrap();

    let (indexed_fixed_fields, indexed_nullable_fields) = index_note_fields(s, &[]);
    register_note(
        s,
        note_serialized_len,
        note_type_id,
        indexed_fixed_fields,
        indexed_nullable_fields
    );

    quote {
        $common
    }
}
