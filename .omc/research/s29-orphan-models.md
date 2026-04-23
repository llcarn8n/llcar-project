# S29 H3.10 — vehicles.json vs kb/ mismatch report

- vehicles.json: **569** model entries
- kb/: **370** modal'ов с папкой
- **Orphans** (vehicle declared, no kb): **199**
- **No-manual** (kb exists, no manual.md in any gen): **52**
- **Strays** (kb folder without vehicles entry): **114**

## Orphans — нужно или найти mapping, или удалить из vehicles.json

| brand | model slug | original id |
|---|---|---|
| lada | kalina_hatchback | `lada_kalina_hatchback` |
| lada | niva_travel | `lada_niva_travel` |
| byd | dolphin_2 | `byd_dolphin_2` |
| byd | han_2 | `byd_han_2` |
| byd | seal_u | `byd_seal_u` |
| byd | song_plus_pfi | `byd_song_plus_pfi` |
| byd | han_ev | `byd_han_ev` |
| bestune | b70 | `bestune_b70` |
| bestune | t77 | `bestune_t77` |
| bestune | t90 | `bestune_t90` |
| bestune | t99 | `bestune_t99` |
| changan | cs35 | `changan_cs35` |
| changan | cs95 | `changan_cs95` |
| changan | uni_v | `changan_uni_v` |
| changan | _cs55_plus | `changan__cs55_plus` |
| changan | _alsvin | `changan__alsvin` |
| changan | _cs35_plus | `changan__cs35_plus` |
| changan | _cs75_plus | `changan__cs75_plus` |
| chery | tiggo_2 | `chery_tiggo_2` |
| chery | tiggo_7 | `chery_tiggo_7` |
| chery | tiggo_8 | `chery_tiggo_8` |
| exeed | rx | `exeed_rx` |
| exeed | sterra_es | `exeed_sterra_es` |
| exeed | sterra_et | `exeed_sterra_et` |
| exeed | yaoguang | `exeed_yaoguang` |
| exeed | tx | `exeed_tx` |
| geely | atlas_pro | `geely_atlas_pro` |
| geely | ex5 | `geely_ex5` |
| geely | emgrand_ev | `geely_emgrand_ev` |
| geely | okavango | `geely_okavango` |
| geely | _cityray | `geely__cityray` |
| haval | h2 | `haval_h2` |
| haval | h4 | `haval_h4` |
| haval | m6 | `haval_m6` |
| jac | t8 | `jac_t8` |
| jetour | vt9 | `jetour_vt9` |
| jetour | _x70_plus | `jetour__x70_plus` |
| li | l6 | `li_l6` |
| li | l7 | `li_l7` |
| li | l8 | `li_l8` |
| li | l9 | `li_l9` |
| li | mega | `li_mega` |
| li | one | `li_one` |
| li | i6 | `li_i6` |
| li | i8 | `li_i8` |
| omoda | 9 | `omoda_9` |
| omoda | c9 | `omoda_c9` |
| omoda | _c5 | `omoda__c5` |
| omoda | e5 | `omoda_e5` |
| voyah | courage | `voyah_courage` |
| voyah | dreamer_2 | `voyah_dreamer_2` |
| voyah | free_2 | `voyah_free_2` |
| voyah | taishan | `voyah_taishan` |
| zeekr | 7gt | `zeekr_7gt` |
| zeekr | 9x | `zeekr_9x` |
| zeekr | mix | `zeekr_mix` |
| hyundai | matrix | `hyundai_matrix` |
| kia | optima_k5 | `kia_optima_k5` |
| honda | jazz | `honda_jazz` |
| honda | edix | `honda_edix` |
| infiniti | ex | `infiniti_ex` |
| infiniti | qx80 | `infiniti_qx80` |
| lexus | ls | `lexus_ls` |
| mazda | 2 | `mazda_2` |
| mazda | cx_7 | `mazda_cx_7` |
| mazda | cx_9 | `mazda_cx_9` |
| mazda | premacy | `mazda_premacy` |
| mazda | tribute | `mazda_tribute` |
| mitsubishi | eclipse_cross | `mitsubishi_eclipse_cross` |
| mitsubishi | delica | `mitsubishi_delica` |
| nissan | sentra | `nissan_sentra` |
| nissan | march | `nissan_march` |
| nissan | cube | `nissan_cube` |
| nissan | elgrand | `nissan_elgrand` |
| subaru | xv | `subaru_xv` |
| suzuki | sx4 | `suzuki_sx4` |
| suzuki | swift | `suzuki_swift` |
| suzuki | grand_vitara | `suzuki_grand_vitara` |
| toyota | 4runner | `toyota_4runner` |
| toyota | auris_2 | `toyota_auris_2` |
| toyota | avensis_2 | `toyota_avensis_2` |
| toyota | c_hr_2 | `toyota_c_hr_2` |
| toyota | crown | `toyota_crown` |
| toyota | fortuner | `toyota_fortuner` |
| toyota | hilux_2 | `toyota_hilux_2` |
| toyota | sienna | `toyota_sienna` |
| toyota | tundra | `toyota_tundra` |
| toyota | venza | `toyota_venza` |
| toyota | mark_2 | `toyota_mark_2` |
| toyota | mark_x | `toyota_mark_x` |
| toyota | corolla_fielder | `toyota_corolla_fielder` |
| toyota | vitz | `toyota_vitz` |
| toyota | wish | `toyota_wish` |
| toyota | caldina | `toyota_caldina` |
| toyota | noah | `toyota_noah` |
| toyota | hilux_surf | `toyota_hilux_surf` |
| toyota | prado_1996 | `toyota_prado_1996` |
| toyota | prado_2002 | `toyota_prado_2002` |
| audi | e_tron | `audi_e_tron` |
| audi | q2 | `audi_q2` |
| audi | tt | `audi_tt` |
| bmw | ix3_2 | `bmw_ix3_2` |
| bmw | i3 | `bmw_i3` |
| mercedes_benz | cla | `mercedes_benz_cla` |
| mercedes_benz | cls | `mercedes_benz_cls` |
| mercedes_benz | eqa | `mercedes_benz_eqa` |
| mercedes_benz | eqb | `mercedes_benz_eqb` |
| mercedes_benz | eqs | `mercedes_benz_eqs` |
| mercedes_benz | gla | `mercedes_benz_gla` |
| mercedes_benz | glb | `mercedes_benz_glb` |
| mercedes_benz | glc | `mercedes_benz_glc` |
| mercedes_benz | glc_coupe | `mercedes_benz_glc_coupe` |
| mercedes_benz | gle | `mercedes_benz_gle` |
| mercedes_benz | gle_coupe | `mercedes_benz_gle_coupe` |
| mercedes_benz | glk_klasse_x204 | `mercedes_benz_glk_klasse_x204` |
| mercedes_benz | gls | `mercedes_benz_gls` |
| mercedes_benz | viano | `mercedes_benz_viano` |
| mercedes_benz | c_class | `mercedes_benz_c_class` |
| mercedes_benz | e_class | `mercedes_benz_e_class` |
| mercedes_benz | ml_w164 | `mercedes_benz_ml_w164` |
| mercedes_benz | s_class | `mercedes_benz_s_class` |
| mercedes_benz | sprinter | `mercedes_benz_sprinter` |
| mercedes_benz | vito | `mercedes_benz_vito` |
| mercedes_benz | gl_class | `mercedes_benz_gl_class` |
| mercedes_benz | m_class | `mercedes_benz_m_class` |
| opel | astra_gtc | `opel_astra_gtc` |
| opel | antara | `opel_antara` |
| opel | frontera | `opel_frontera` |
| opel | insignia | `opel_insignia` |
| opel | mokka | `opel_mokka` |
| opel | vectra_hatchback | `opel_vectra_hatchback` |
| opel | vectra_sedan | `opel_vectra_sedan` |
| opel | corsa | `opel_corsa` |
| opel | zafira | `opel_zafira` |
| porsche | cayenne_coupe | `porsche_cayenne_coupe` |
| porsche | cayman | `porsche_cayman` |
| porsche | panamera | `porsche_panamera` |
| volkswagen | caddy | `volkswagen_caddy` |
| volkswagen | caravelle_2 | `volkswagen_caravelle_2` |
| volkswagen | crafter | `volkswagen_crafter` |
| volkswagen | golf_2 | `volkswagen_golf_2` |
| volkswagen | id4 | `volkswagen_id4` |
| volkswagen | jetta_2 | `volkswagen_jetta_2` |
| volkswagen | multivan | `volkswagen_multivan` |
| volkswagen | passat_2 | `volkswagen_passat_2` |
| volkswagen | polo_2 | `volkswagen_polo_2` |
| volkswagen | passat_cc | `volkswagen_passat_cc` |
| volkswagen | sharan_2 | `volkswagen_sharan_2` |
| volkswagen | scirocco | `volkswagen_scirocco` |
| volkswagen | t_roc_2 | `volkswagen_t_roc_2` |
| volkswagen | taos_2 | `volkswagen_taos_2` |
| volkswagen | teramont_2 | `volkswagen_teramont_2` |
| volkswagen | tiguan_2 | `volkswagen_tiguan_2` |
| volkswagen | touareg_2 | `volkswagen_touareg_2` |
| volkswagen | touran | `volkswagen_touran` |
| volkswagen | transporter_2 | `volkswagen_transporter_2` |
| volkswagen | golf3 | `volkswagen_golf3` |
| volkswagen | polo_sedan | `volkswagen_polo_sedan` |
| citroen | berlingo | `citroen_berlingo` |
| citroen | c3 | `citroen_c3` |
| citroen | c5_aircross | `citroen_c5_aircross` |
| citroen | c_crosser | `citroen_c_crosser` |
| peugeot | 2008 | `peugeot_2008` |
| peugeot | 5008 | `peugeot_5008` |
| renault | kangoo_2 | `renault_kangoo_2` |
| renault | scenic | `renault_scenic` |
| cadillac | srx | `cadillac_srx` |
| cadillac | xt4 | `cadillac_xt4` |
| cadillac | ct5 | `cadillac_ct5` |
| chevrolet | tahoe | `chevrolet_tahoe` |
| chevrolet | equinox | `chevrolet_equinox` |
| chevrolet | tracker | `chevrolet_tracker` |
| ford | ecosport | `ford_ecosport` |
| ford | edge | `ford_edge` |
| ford | f_150 | `ford_f_150` |
| ford | fiesta | `ford_fiesta` |
| ford | transit | `ford_transit` |
| jeep | renegade | `jeep_renegade` |
| jaguar | e_pace | `jaguar_e_pace` |
| jaguar | xe | `jaguar_xe` |
| land_rover | defender | `land_rover_defender` |
| land_rover | range_rover_evoque | `land_rover_range_rover_evoque` |
| mini | clubman | `mini_clubman` |
| mini | hatch | `mini_hatch` |
| fiat | doblo | `fiat_doblo` |
| skoda | fabia_2 | `skoda_fabia_2` |
| skoda | karoq_2 | `skoda_karoq_2` |
| skoda | kodiaq_2 | `skoda_kodiaq_2` |
| skoda | octavia_3 | `skoda_octavia_3` |
| skoda | octavia_ii | `skoda_octavia_ii` |
| skoda | rapid_spaceback | `skoda_rapid_spaceback` |
| skoda | scala_2 | `skoda_scala_2` |
| skoda | superb_2 | `skoda_superb_2` |
| skoda | yeti_2 | `skoda_yeti_2` |
| skoda | octavia_a5 | `skoda_octavia_a5` |
| volvo | s90 | `volvo_s90` |
| volvo | v60 | `volvo_v60` |
| volvo | v90 | `volvo_v90` |
| volvo | xc70 | `volvo_xc70` |

## No-manual — kb-папка есть, gen-ы без manual.md

| brand | model slug | gen count |
|---|---|--:|
| baic | x35 | 2 |
| baic | x55 | 1 |
| changan | uni_k | 1 |
| changan | uni_t | 1 |
| exeed | lx | 1 |
| exeed | vx | 1 |
| forthing | t5_evo | 1 |
| forthing | 580 | 1 |
| forthing | ax7 | 1 |
| forthing | h30_cross | 1 |
| gac | emkoo | 1 |
| gac | gs3 | 1 |
| gac | gs8 | 1 |
| gac | gn8 | 1 |
| haval | dargo | 1 |
| jac | js4 | 1 |
| jaecoo | j6 | 1 |
| jaecoo | _j7_phev | 1 |
| kaiyi | showjet | 1 |
| kaiyi | _x3_pro | 1 |
| kaiyi | _x7_kunlun | 1 |
| livan | 7 | 1 |
| tank | 500 | 1 |
| zeekr | 001 | 1 |
| zeekr | 007 | 1 |
| zeekr | x | 1 |
| daewoo | lacetti | 1 |
| kia | soul | 2 |
| ssangyong | tivoli | 1 |
| datsun | mi_do | 1 |
| lexus | lx | 2 |
| lexus | rx | 1 |
| mitsubishi | lancer | 1 |
| toyota | highlander | 1 |
| audi | a3 | 1 |
| audi | a5 | 2 |
| audi | a7 | 2 |
| audi | a8 | 1 |
| audi | q3 | 2 |
| audi | q8 | 1 |
| bmw | 2_series | 2 |
| bmw | x2 | 1 |
| bmw | x4 | 1 |
| renault | arkana | 1 |
| renault | koleos | 2 |
| cadillac | xt5 | 1 |
| land_rover | discovery_sport | 1 |
| mini | countryman | 1 |
| belgee | x80 | 1 |
| fiat | 500 | 1 |
| fiat | ducato | 1 |
| volvo | xc40 | 1 |

## Strays — kb/ папки не объявлены в vehicles.json

| brand | model slug |
|---|---|
| acura | mdx |
| acura | rdx |
| aion | y |
| alfa_romeo | giulia |
| alfa_romeo | stelvio |
| audi | e_tron_gt |
| audi | q4_e_tron |
| audi | rs6 |
| avatr | 11 |
| avatr | 12 |
| bmw | i5 |
| bmw | i7 |
| bmw | ix3 |
| bmw | z4 |
| byd | dolphin |
| byd | han |
| cadillac | xt6 |
| changan | cs35_plus |
| changan | cs75_plus |
| chery | tiggo2_pro |
| chery | tiggo4_pro |
| chrysler | 300c |
| deepal | s07 |
| dodge | challenger |
| dodge | charger |
| faw_bestune | b70 |
| faw_bestune | t77 |
| faw_bestune | t90 |
| faw_bestune | t99 |
| forthing | friday |
| geely | cityray |
| hiphi | x |
| hyundai | genesis_g70 |
| hyundai | genesis_g80 |
| hyundai | genesis_g90 |
| hyundai | genesis_gv70 |
| hyundai | genesis_gv80 |
| hyundai | ioniq6 |
| im_motors | l7 |
| jidu | robocar_01 |
| kia | optima |
| kia | telluride |
| land_rover | rr_sport |
| leap_motor | c11 |
| li_auto | l7 |
| li_auto | l8 |
| li_auto | l9 |
| li_auto | li_i6 |
| li_auto | li_i8 |
| li_auto | li_l6 |
| li_auto | li_mega |
| li_auto | li_one |
| li_auto | misc_1503a4f7 |
| lincoln | aviator |
| lincoln | navigator |
| lucid | air |
| mazda | cx50 |
| mazda | cx7 |
| mazda | cx9 |
| mercedes | a_class |
| mercedes | amg_gt |
| mercedes | c_class |
| mercedes | cla |
| mercedes | cls |
| mercedes | e_class |
| mercedes | eqc |
| mercedes | eqe |
| mercedes | eqs |
| mercedes | g_class |
| mercedes | gl_class |
| mercedes | gla |
| mercedes | glb |
| mercedes | glc |
| mercedes | gle |
| mercedes | gls |
| mercedes | m_class |
| mercedes | ml_w164 |
| mercedes | s_class |
| mercedes | sl |
| mercedes | sprinter |
| mercedes | v_class |
| mercedes | viano |
| mercedes | vito |
| nio | et7 |
| omoda | c5 |
| opel | insignia_b |
| renault | kangoo |
| rivian | r1s |
| rivian | r1t |
| skoda | fabia |
| skoda | karoq |
| skoda | kodiaq |
| skoda | octavia |
| skoda | scala |
| skoda | superb |
| smart | forfour |
| smart | fortwo |
| tesla | model_3 |
| tesla | model_s |
| tesla | model_x |
| tesla | model_y |
| toyota | avensis |
| toyota | bz4x |
| toyota | hilux |
| toyota | sienta |
| volkswagen | golf |
| volkswagen | jetta |
| volkswagen | passat |
| volkswagen | polo |
| volkswagen | tiguan |
| volkswagen | touareg |
| voyah | dreamer |
| voyah | free |
| xpeng | p7 |
