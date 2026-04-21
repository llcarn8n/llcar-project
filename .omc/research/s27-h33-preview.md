# S27 H3.3 — превью декомпозиции 424 unmatched src_dir → model/gen

**Как читать:** если видишь странный `target_model` или `target_gen`,
укажи мне конкретную строку с альтернативой (например `chery/tiggo_4_pro_2022`
должно быть `model=tiggo_4_pro` но я вывел `model=tiggo`).

**Правила автоматической декомпозиции:**
- `_YYYY` в конце → модель = всё до года (`clio_iii_2005` → `clio_iii`/`clio_iii_2005`)
- `_iii/_iv/_v/_vi` (римские) → модель = до римских
- `_mk3/_v2` → модель = до mk/v кода
- иначе → модель = весь slug, gen = `<slug>_main`
- для `merge_*` с непустым top candidate — берём `<model>/<gen>` из triage

## create_new_model (337)

| brand | src_dir | size MB | target model | target gen | reason |
|---|---|---:|---|---|---|
| renault | clio_iii_2005 | 17.2 | `clio` | `clio_iii_2005` | known-prefix:clio |
| renault | laguna_iii_2009 | 17.1 | `laguna` | `laguna_iii_2009` | known-prefix:laguna |
| ford | ecosport | 14.2 | `ecosport` | `ecosport_main` | known-exact:ecosport |
| jaguar | xj | 13.8 | `xj` | `xj_main` | known-exact:xj |
| chery | 7_m16_service_manual | 13.0 | `7_m16_service_manual` | `7_m16_service_manual_main` | no-suffix |
| jeep | renegade | 12.3 | `renegade` | `renegade_main` | known-exact:renegade |
| ford | mustang | 12.0 | `mustang` | `mustang_main` | known-exact:mustang |
| chevrolet | equinox | 11.8 | `equinox` | `equinox_main` | known-exact:equinox |
| geely | emgrand_ev | 11.0 | `emgrand_ev` | `emgrand_ev_main` | known-exact:emgrand_ev |
| renault | scenic | 10.4 | `scenic` | `scenic_main` | known-exact:scenic |
| subaru | brz | 10.1 | `brz` | `brz_main` | known-exact:brz |
| byd | yuan_plus | 9.8 | `yuan_plus` | `yuan_plus_main` | known-exact:yuan_plus |
| peugeot | 407 | 9.4 | `407` | `407_main` | known-exact:407 |
| peugeot | 406 | 8.1 | `406` | `406_main` | known-exact:406 |
| honda | crosstour_2010 | 8.0 | `crosstour` | `crosstour_2010` | known-prefix:crosstour |
| infiniti | fx_ru | 7.8 | `fx` | `fx_ru` | known-prefix:fx |
| infiniti | fx | 7.7 | `fx` | `fx_main` | known-exact:fx |
| mitsubishi | pajero2 | 7.6 | `pajero2` | `pajero2_main` | no-suffix |
| lada | kalina | 7.5 | `kalina` | `kalina_main` | known-exact:kalina |
| chery | arrizo_7_m16_service_manual | 7.5 | `arrizo_7` | `arrizo_7_m16_service_manual` | known-prefix:arrizo_7 |
| jaguar | jaguar_xf | 7.4 | `xf` | `xf_main` | known-exact:xf |
| ford | s_max | 7.4 | `s_max` | `s_max_main` | known-exact:s_max |
| land_rover | freelander | 7.3 | `freelander` | `freelander_main` | known-exact:freelander |
| fiat | bravo | 6.8 | `bravo` | `bravo_main` | known-exact:bravo |
| ford | explorer | 6.4 | `explorer` | `explorer_main` | known-exact:explorer |
| opel | combo_life | 6.3 | `combo_life` | `combo_life_main` | known-exact:combo_life |
| renault | megane_scenic | 5.5 | `megane` | `megane_scenic` | known-prefix:megane |
| nissan | march | 5.5 | `march` | `march_main` | known-exact:march |
| opel | vectra_c_2002 | 5.3 | `vectra_c` | `vectra_c_2002` | known-prefix:vectra_c |
| opel | vectra_c | 5.3 | `vectra_c` | `vectra_c_main` | known-exact:vectra_c |
| cadillac | cadillac_escalade | 5.1 | `escalade` | `escalade_main` | known-exact:escalade |
| cadillac | escalade | 5.0 | `escalade` | `escalade_main` | known-exact:escalade |
| opel | meriva_b | 5.0 | `meriva_b` | `meriva_b_main` | known-exact:meriva_b |
| hyundai | i30 | 5.0 | `i30` | `i30_main` | known-exact:i30 |
| opel | meriva | 5.0 | `meriva` | `meriva_main` | known-exact:meriva |
| citroen | c3_picasso | 4.9 | `c3_picasso` | `c3_picasso_main` | no-suffix |
| fiat | palio | 4.8 | `palio` | `palio_main` | known-exact:palio |
| citroen | xsara | 4.7 | `xsara` | `xsara_main` | no-suffix |
| voyah | dreamer_2 | 4.7 | `dreamer_2` | `dreamer_2_main` | no-suffix |
| fiat | marea | 4.7 | `marea` | `marea_main` | known-exact:marea |
| mitsubishi | pajero_pinin | 4.6 | `pajero` | `pajero_pinin` | known-prefix:pajero |
| volkswagen | jetta_2 | 4.6 | `jetta` | `jetta_2` | known-prefix:jetta |
| renault | megan_scenic_1996 | 4.5 | `megan_scenic` | `megan_scenic_1996` | year-suffix |
| peugeot | boxer | 4.4 | `boxer` | `boxer_main` | known-exact:boxer |
| lexus | rx270_rx350_2009 | 4.4 | `rx270_rx350` | `rx270_rx350_2009` | year-suffix |
| exeed | txtxl | 4.4 | `txtxl` | `txtxl_main` | no-suffix |
| daewoo | lanos_2000 | 4.3 | `lanos` | `lanos_2000` | year-suffix |
| citroen | xsara_picasso | 4.2 | `xsara_picasso` | `xsara_picasso_main` | no-suffix |
| ford | escape_maverick | 4.2 | `escape` | `escape_maverick` | known-prefix:escape |
| citroen | zx | 4.2 | `zx` | `zx_main` | no-suffix |
| toyota | yaris | 4.2 | `yaris` | `yaris_main` | known-exact:yaris |
| renault | symbol_thalia_2008 | 4.1 | `symbol` | `symbol_thalia_2008` | known-prefix:symbol |
| mazda | mazda3 | 4.1 | `mazda3` | `mazda3_main` | known-exact:mazda3 |
| volkswagen | jetta_2010 | 4.1 | `jetta` | `jetta_2010` | known-prefix:jetta |
| volvo | s40 | 4.0 | `s40` | `s40_main` | known-exact:s40 |
| fiat | tempra | 4.0 | `tempra` | `tempra_main` | no-suffix |
| livan | x50 | 4.0 | `x50` | `x50_main` | no-suffix |
| haval | h6 | 4.0 | `h6` | `h6_main` | known-exact:h6 |
| peugeot | 207 | 4.0 | `207` | `207_main` | known-exact:207 |
| jaguar | xf | 4.0 | `xf` | `xf_main` | known-exact:xf |
| fiat | punto | 3.9 | `punto` | `punto_main` | known-exact:punto |
| chevrolet | cobalt_2018 | 3.9 | `cobalt` | `cobalt_2018` | known-prefix:cobalt |
| peugeot | 405 | 3.9 | `405` | `405_main` | no-suffix |
| chevrolet | cobalt | 3.8 | `cobalt` | `cobalt_main` | known-exact:cobalt |
| ford | bronco_2_explorer_ranger | 3.8 | `bronco_2_explorer_ranger` | `bronco_2_explorer_ranger_main` | no-suffix |
| toyota | mark_x | 3.8 | `mark` | `mark_x` | roman-suffix |
| chevrolet | orlando | 3.8 | `orlando` | `orlando_main` | known-exact:orlando |
| lexus | toyota_mark_x_2004_2009_lexus_is250_gs300 | 3.8 | `toyota_mark` | `toyota_mark_x_2004_2009_lexus_is250_gs300` | roman+year |
| audi | a1 | 3.8 | `a1` | `a1_main` | known-exact:a1 |
| lada | kalina_hatchback | 3.7 | `kalina` | `kalina_hatchback` | known-prefix:kalina |
| chery | arrizo_7 | 3.7 | `arrizo_7` | `arrizo_7_main` | known-exact:arrizo_7 |
| peugeot | 306 | 3.7 | `306` | `306_main` | known-exact:306 |
| renault | laguna | 3.6 | `laguna` | `laguna_main` | known-exact:laguna |
| honda | pilot | 3.5 | `pilot` | `pilot_main` | known-exact:pilot |
| chevrolet | spark | 3.5 | `spark` | `spark_main` | known-exact:spark |
| chevrolet | niva | 3.5 | `niva` | `niva_main` | known-exact:niva |
| renault | clio_symbol_symbol | 3.4 | `clio` | `clio_symbol_symbol` | known-prefix:clio |
| chevrolet | orlando_2011 | 3.4 | `orlando` | `orlando_2011` | known-prefix:orlando |
| fiat | croma | 3.4 | `croma` | `croma_main` | no-suffix |
| opel | vectra | 3.4 | `vectra` | `vectra_main` | known-exact:vectra |
| jaguar | jaguar_xf_2011_2015 | 3.3 | `xf` | `xf_2011_2015` | known-prefix:xf |
| suzuki | liana_2003 | 3.2 | `liana` | `liana_2003` | year-suffix |
| mazda | cx7 | 3.2 | `cx7` | `cx7_main` | known-exact:cx7 |
| peugeot | 605 | 3.2 | `605` | `605_main` | no-suffix |
| mitsubishi | l200_2022 | 3.2 | `l200` | `l200_2022` | known-prefix:l200 |
| mitsubishi | l200_2023 | 3.2 | `l200` | `l200_2023` | known-prefix:l200 |
| honda | accord_2003 | 3.2 | `accord` | `accord_2003` | known-prefix:accord |
| honda | accord | 3.2 | `accord` | `accord_main` | known-exact:accord |
| mitsubishi | l200_2021 | 3.2 | `l200` | `l200_2021` | known-prefix:l200 |
| mitsubishi | l200_2020 | 3.2 | `l200` | `l200_2020` | known-prefix:l200 |
| daewoo | espero_1991 | 3.1 | `espero` | `espero_1991` | year-suffix |
| renault | megane | 3.1 | `megane` | `megane_main` | known-exact:megane |
| ford | tourus_mercury_sable_1986_1994 | 3.0 | `tourus_mercury_sable` | `tourus_mercury_sable_1986_1994` | year-suffix |
| uaz | 2008_2cad14d8 | 3.0 | `2008_2cad14d8` | `2008_2cad14d8_main` | no-suffix |
| renault | twingo_1993 | 3.0 | `twingo` | `twingo_1993` | known-prefix:twingo |
| opel | omega_b | 3.0 | `omega` | `omega_b` | known-prefix:omega |
| mazda | mx5_miata | 3.0 | `mx5` | `mx5_miata` | known-prefix:mx5 |
| land_rover | rr_sport | 2.9 | `rr_sport` | `rr_sport_main` | no-suffix |
| opel | vectra_b | 2.9 | `vectra_b` | `vectra_b_main` | known-exact:vectra_b |
| mazda | mx_5 | 2.9 | `mx_5` | `mx_5_main` | known-exact:mx_5 |
| peugeot | 307 | 2.8 | `307` | `307_main` | known-exact:307 |
| skoda | scala | 2.8 | `scala` | `scala_main` | known-exact:scala |
| mitsubishi | l200_2018 | 2.8 | `l200` | `l200_2018` | known-prefix:l200 |
| mitsubishi | l200_2017 | 2.7 | `l200` | `l200_2017` | known-prefix:l200 |
| peugeot | 205 | 2.7 | `205` | `205_main` | no-suffix |
| mitsubishi | l200_2019 | 2.7 | `l200` | `l200_2019` | known-prefix:l200 |
| mitsubishi | l200_2015 | 2.7 | `l200` | `l200_2015` | known-prefix:l200 |
| mazda | premacy | 2.7 | `premacy` | `premacy_main` | known-exact:premacy |
| opel | vectra_sedan | 2.7 | `vectra` | `vectra_sedan` | known-prefix:vectra |
| nissan | juke | 2.6 | `juke` | `juke_main` | known-exact:juke |
| honda | stepwgn | 2.6 | `stepwgn` | `stepwgn_main` | no-suffix |
| mitsubishi | l200_2016 | 2.6 | `l200` | `l200_2016` | known-prefix:l200 |
| lada | priora | 2.6 | `priora` | `priora_main` | known-exact:priora |
| baic | bj60 | 2.6 | `bj60` | `bj60_main` | no-suffix |
| mitsubishi | pajero_2014 | 2.6 | `pajero` | `pajero_2014` | known-prefix:pajero |
| renault | renault_megane_scenic_1999_2002 | 2.6 | `megane` | `megane_scenic_1999_2002` | known-prefix:megane |
| zeekr | 7x | 2.5 | `7x` | `7x_main` | no-suffix |
| chevrolet | camaro | 2.5 | `camaro` | `camaro_main` | known-exact:camaro |
| mitsubishi | l200_2014 | 2.4 | `l200` | `l200_2014` | known-prefix:l200 |
| fiat | coupe | 2.4 | `coupe` | `coupe_main` | no-suffix |
| cadillac | cadillac_escalade_ru_reocr | 2.4 | `escalade` | `escalade_ru_reocr` | known-prefix:escalade |
| jaguar | jaguar_xj_2010_2012 | 2.3 | `xj` | `xj_2010_2012` | known-prefix:xj |
| lada | 2008_d91309f0 | 2.3 | `2008_d91309f0` | `2008_d91309f0_main` | no-suffix |
| nissan | 2023_nissan_ariya | 2.2 | `2023_nissan_ariya` | `2023_nissan_ariya_main` | no-suffix |
| nissan | ariya | 2.2 | `ariya` | `ariya_main` | no-suffix |
| peugeot | 807 | 2.2 | `807` | `807_main` | known-exact:807 |
| volvo | 740_760 | 2.1 | `740_760` | `740_760_main` | no-suffix |
| ford | escort | 2.1 | `escort` | `escort_main` | no-suffix |
| toyota | hilux_2011_v2_ru_reocr | 2.0 | `hilux` | `hilux_2011_v2_ru_reocr` | known-prefix:hilux |
| chery | arrizo_8 | 2.0 | `arrizo_8` | `arrizo_8_main` | known-exact:arrizo_8 |
| nissan | leaf_2020 | 2.0 | `leaf` | `leaf_2020` | known-prefix:leaf |
| subaru | impreza_v2_ru_reocr | 2.0 | `impreza` | `impreza_v2_ru_reocr` | known-prefix:impreza |
| ford | escape | 2.0 | `escape` | `escape_main` | known-exact:escape |
| nissan | tiida | 2.0 | `tiida` | `tiida_main` | known-exact:tiida |
| chevrolet | captiva | 2.0 | `captiva` | `captiva_main` | known-exact:captiva |
| toyota | yaris_da605e90 | 2.0 | `yaris` | `yaris_da605e90` | known-prefix:yaris |
| ford | ford_escape_maverick_2000_2007 | 2.0 | `escape` | `escape_maverick_2000_2007` | known-prefix:escape |
| mazda | demio | 2.0 | `demio` | `demio_main` | known-exact:demio |
| skoda | scala_2 | 2.0 | `scala` | `scala_2` | known-prefix:scala |
| byd | l_dmi_manual_rus_last | 1.9 | `l_dmi_manual_rus` | `l_dmi_manual_rus_last` | code-suffix |
| fiat | uno | 1.9 | `uno` | `uno_main` | known-exact:uno |
| nissan | leaf_2012 | 1.9 | `leaf` | `leaf_2012` | known-prefix:leaf |
| byd | song_l_dmi_manual_rus_last | 1.9 | `song` | `song_l_dmi_manual_rus_last` | known-prefix:song |
| mazda | mpv_1996 | 1.9 | `mpv` | `mpv_1996` | year-suffix |
| mazda | mazda6 | 1.9 | `mazda6` | `mazda6_main` | known-exact:mazda6 |
| nissan | kicks | 1.9 | `kicks` | `kicks_main` | known-exact:kicks |
| chevrolet | captiva_2009 | 1.9 | `captiva` | `captiva_2009` | known-prefix:captiva |
| volvo | s40_v40_ocr | 1.9 | `s40` | `s40_v40_ocr` | known-prefix:s40 |
| suzuki | jimny_jimny_wide_jimny_sierra_1998 | 1.8 | `jimny` | `jimny_jimny_wide_jimny_sierra_1998` | known-prefix:jimny |
| mitsubishi | eclipse_cross | 1.8 | `eclipse` | `eclipse_cross` | known-prefix:eclipse |
| peugeot | 308 | 1.8 | `308` | `308_main` | known-exact:308 |
| ford | ford_bronco_2_explorer_ranger_1983_1994 | 1.8 | `bronco_2_explorer_ranger` | `bronco_2_explorer_ranger_1983_1994` | year-suffix |
| byd | plus_ev2023_champion_edition_user_manual | 1.8 | `plus_ev2023_champion_edition_user_manual` | `plus_ev2023_champion_edition_user_manual_main` | no-suffix |
| uaz | misc_033d20b3 | 1.8 | `misc_033d20b3` | `misc_033d20b3_main` | no-suffix |
| chevrolet | misc_949f8aaa | 1.7 | `misc_949f8aaa` | `misc_949f8aaa_main` | no-suffix |
| hyundai | i40 | 1.7 | `i40` | `i40_main` | known-exact:i40 |
| voyah | passion | 1.7 | `passion` | `passion_main` | known-exact:passion |
| byd | song_plus_ev2023_champion_edition_user_manual | 1.7 | `song_plus` | `song_plus_ev2023_champion_edition_user_manual` | known-prefix:song_plus |
| porsche | taycan | 1.7 | `taycan` | `taycan_main` | known-exact:taycan |
| ford | ranger | 1.7 | `ranger` | `ranger_main` | known-exact:ranger |
| chevrolet | aveo | 1.7 | `aveo` | `aveo_main` | known-exact:aveo |
| kia | picanto | 1.7 | `picanto` | `picanto_main` | known-exact:picanto |
| suzuki | jimny | 1.7 | `jimny` | `jimny_main` | known-exact:jimny |
| peugeot | 106 | 1.7 | `106` | `106_main` | known-exact:106 |
| renault | clio_symbol_2000 | 1.7 | `clio` | `clio_symbol_2000` | known-prefix:clio |
| renault | kangoo_2 | 1.7 | `kangoo` | `kangoo_2` | known-prefix:kangoo |
| lada | misc_a80d0524 | 1.7 | `misc_a80d0524` | `misc_a80d0524_main` | no-suffix |
| ford | 2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us | 1.6 | `2021_ford_mustang_mach_e_owners_manual_version_1_om_en` | `2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us` | code-suffix |
| volkswagen | 2023_volkswagen_id4_12 | 1.6 | `2023_volkswagen_id4_12` | `2023_volkswagen_id4_12_main` | no-suffix |
| ford | mustang_mach_e | 1.6 | `mustang` | `mustang_mach_e` | known-prefix:mustang |
| chery | a13 | 1.6 | `a13` | `a13_main` | no-suffix |
| mazda | cx_60 | 1.6 | `cx_60` | `cx_60_main` | no-suffix |
| jetour | t1 | 1.6 | `t1` | `t1_main` | known-exact:t1 |
| renault | renault_megane_scenic_1999_2003 | 1.6 | `megane` | `megane_scenic_1999_2003` | known-prefix:megane |
| hyundai | kona | 1.6 | `kona` | `kona_main` | no-suffix |
| hyundai | i40_2 | 1.6 | `i40` | `i40_2` | known-prefix:i40 |
| ford | maverick | 1.6 | `maverick` | `maverick_main` | no-suffix |
| lexus | is | 1.6 | `is` | `is_main` | known-exact:is |
| renault | laguna_7af14511 | 1.6 | `laguna` | `laguna_7af14511` | known-prefix:laguna |
| renault | renault_clio_symbol_symbol_1999_2008 | 1.6 | `clio` | `clio_symbol_symbol_1999_2008` | known-prefix:clio |
| kia | niro | 1.6 | `niro` | `niro_main` | known-exact:niro |
| honda | accord_2003_2008 | 1.6 | `accord` | `accord_2003_2008` | known-prefix:accord |
| livan | misc_7fd8c177 | 1.5 | `misc_7fd8c177` | `misc_7fd8c177_main` | no-suffix |
| kia | 2019_kia_niro | 1.5 | `2019_kia` | `2019_kia_niro` | code-suffix |
| kia | k8 | 1.5 | `k8` | `k8_main` | no-suffix |
| nissan | primera_v2_ru_reocr | 1.5 | `primera_v2_ru_reocr` | `primera_v2_ru_reocr_main` | no-suffix |
| chevrolet | niva_travel | 1.5 | `niva` | `niva_travel` | known-prefix:niva |
| lada | misc_f87afd80 | 1.5 | `misc_f87afd80` | `misc_f87afd80_main` | no-suffix |
| chevrolet | niva_travel_1070ed5b | 1.5 | `niva` | `niva_travel_1070ed5b` | known-prefix:niva |
| nissan | elgrand | 1.5 | `elgrand` | `elgrand_main` | no-suffix |
| jetour | x90 | 1.5 | `x90` | `x90_main` | known-exact:x90 |
| lexus | gx | 1.5 | `gx` | `gx_main` | known-exact:gx |
| land_rover | discovery_iii | 1.5 | `discovery` | `discovery_iii` | known-prefix:discovery |
| uaz | 2008 | 1.5 | `2008` | `2008_main` | no-suffix |
| changan | 2023_05_26__plus_owner_manual_rus__1 | 1.5 | `2023_05_26__plus_owner_manual_rus__1` | `2023_05_26__plus_owner_manual_rus__1_main` | no-suffix |
| fiat | ocr | 1.5 | `ocr` | `ocr_main` | no-suffix |
| renault | renault_megane_ii_2003_2008 | 1.5 | `megane` | `megane_ii_2003_2008` | known-prefix:megane |
| renault | kangoo_1997 | 1.5 | `kangoo` | `kangoo_1997` | known-prefix:kangoo |
| omoda | c7 | 1.4 | `c7` | `c7_main` | no-suffix |
| livan | 2008_11559170 | 1.4 | `2008_11559170` | `2008_11559170_main` | no-suffix |
| geely | cityray | 1.4 | `cityray` | `cityray_main` | no-suffix |
| lexus | ux | 1.4 | `ux` | `ux_main` | known-exact:ux |
| citroen | c4 | 1.4 | `c4` | `c4_main` | no-suffix |
| renault | renault_safrane_1992_1996 | 1.4 | `safrane` | `safrane_1992_1996` | year-suffix |
| lexus | lc | 1.4 | `lc` | `lc_main` | known-exact:lc |
| mitsubishi | galant_1990 | 1.4 | `galant` | `galant_1990` | known-prefix:galant |
| nissan | leaf | 1.4 | `leaf` | `leaf_main` | known-exact:leaf |
| uaz | misc_615771d0 | 1.4 | `misc_615771d0` | `misc_615771d0_main` | no-suffix |
| byd | byd_sealion_06 | 1.4 | `sealion` | `sealion_06` | known-prefix:sealion |
| uaz | misc_66dd73e9 | 1.4 | `misc_66dd73e9` | `misc_66dd73e9_main` | no-suffix |
| subaru | legacy | 1.4 | `legacy` | `legacy_main` | known-exact:legacy |
| toyota | aristo | 1.3 | `aristo` | `aristo_main` | no-suffix |
| mitsubishi | l200 | 1.3 | `l200` | `l200_main` | known-exact:l200 |
| hyundai | venue | 1.3 | `venue` | `venue_main` | no-suffix |
| lada | misc_9c402cc0 | 1.3 | `misc_9c402cc0` | `misc_9c402cc0_main` | no-suffix |
| chevrolet | rezzo | 1.3 | `rezzo` | `rezzo_main` | known-exact:rezzo |
| nissan | navara_v2_ru_reocr | 1.2 | `navara` | `navara_v2_ru_reocr` | known-prefix:navara |
| jetour | x50 | 1.2 | `x50` | `x50_main` | no-suffix |
| peugeot | peugeot_307_2001_2008 | 1.2 | `307` | `307_2001_2008` | known-prefix:307 |
| renault | renault_laguna_2001_2005 | 1.2 | `laguna` | `laguna_2001_2005` | known-prefix:laguna |
| changan | changan__cs55_plus | 1.2 | `_cs55` | `_cs55_plus` | code-suffix |
| chery | qq_s11 | 1.2 | `qq` | `qq_s11` | known-prefix:qq |
| porsche | boxster | 1.2 | `boxster` | `boxster_main` | no-suffix |
| uaz | misc_97a47f17 | 1.2 | `misc_97a47f17` | `misc_97a47f17_main` | no-suffix |
| chery | tiggo_4_new | 1.2 | `tiggo_4` | `tiggo_4_new` | known-prefix:tiggo_4 |
| bmw | 5_e28 | 1.2 | `5_e28` | `5_e28_main` | no-suffix |
| opel | omega | 1.1 | `omega` | `omega_main` | known-exact:omega |
| porsche | 911_ru | 1.1 | `911` | `911_ru` | known-prefix:911 |
| mitsubishi | pajero_iv_ru | 1.1 | `pajero` | `pajero_iv_ru` | known-prefix:pajero |
| lada | 2008 | 1.1 | `2008` | `2008_main` | no-suffix |
| nissan | primera | 1.1 | `primera` | `primera_main` | no-suffix |
| lada | misc_838aff7c | 1.1 | `misc_838aff7c` | `misc_838aff7c_main` | no-suffix |
| lada | misc_ae412d57 | 1.1 | `misc_ae412d57` | `misc_ae412d57_main` | no-suffix |
| mitsubishi | galant | 1.1 | `galant` | `galant_main` | known-exact:galant |
| lada | misc_d8ae2464 | 1.1 | `misc_d8ae2464` | `misc_d8ae2464_main` | no-suffix |
| changan | changan_q07 | 1.1 | `q07` | `q07_main` | no-suffix |
| lada | misc_ef2a6942 | 1.1 | `misc_ef2a6942` | `misc_ef2a6942_main` | no-suffix |
| toyota | misc_37edd5bb | 1.1 | `misc_37edd5bb` | `misc_37edd5bb_main` | no-suffix |
| hyundai | starex | 1.0 | `starex` | `starex_main` | known-exact:starex |
| honda | hr_v | 1.0 | `hr_v` | `hr_v_main` | known-exact:hr_v |
| chery | chery_tiggo_9 | 1.0 | `tiggo_9` | `tiggo_9_main` | known-exact:tiggo_9 |
| byd | 24__dmi_rus__1 | 1.0 | `24__dmi_rus__1` | `24__dmi_rus__1_main` | no-suffix |
| chevrolet | misc_c8f27c4c | 1.0 | `misc_c8f27c4c` | `misc_c8f27c4c_main` | no-suffix |
| lada | misc_b404cc25 | 1.0 | `misc_b404cc25` | `misc_b404cc25_main` | no-suffix |
| mazda | cx_3 | 1.0 | `cx_3` | `cx_3_main` | known-exact:cx_3 |
| volkswagen | beetle | 1.0 | `beetle` | `beetle_main` | known-exact:beetle |
| lada | misc_5eb070ad | 1.0 | `misc_5eb070ad` | `misc_5eb070ad_main` | no-suffix |
| lada | misc_11f8ee81 | 1.0 | `misc_11f8ee81` | `misc_11f8ee81_main` | no-suffix |
| hongqi | hongqi_ehs9 | 1.0 | `ehs9` | `ehs9_main` | no-suffix |
| lada | misc_ebf8b743 | 1.0 | `misc_ebf8b743` | `misc_ebf8b743_main` | no-suffix |
| hongqi | hongqi_hq9 | 0.9 | `hq9` | `hq9_main` | no-suffix |
| exeed | es | 0.9 | `es` | `es_main` | no-suffix |
| lada | misc_6fdc291d | 0.9 | `misc_6fdc291d` | `misc_6fdc291d_main` | no-suffix |
| lada | misc_f7cbfc74 | 0.9 | `misc_f7cbfc74` | `misc_f7cbfc74_main` | no-suffix |
| toyota | harrier | 0.9 | `harrier` | `harrier_main` | no-suffix |
| lada | misc_87792b32 | 0.9 | `misc_87792b32` | `misc_87792b32_main` | no-suffix |
| byd | byd_sealion_05 | 0.9 | `sealion` | `sealion_05` | known-prefix:sealion |
| mazda | mazda_demio_1996_2002 | 0.9 | `demio` | `demio_1996_2002` | known-prefix:demio |
| audi | 100 | 0.9 | `100` | `100_main` | no-suffix |
| exeed | exeed_et | 0.9 | `et` | `et_main` | no-suffix |
| toyota | rush | 0.9 | `rush` | `rush_main` | no-suffix |
| uaz | misc_9c3fe8cd | 0.9 | `misc_9c3fe8cd` | `misc_9c3fe8cd_main` | no-suffix |
| gac | gac_s7 | 0.9 | `s7` | `s7_main` | no-suffix |
| chevrolet | trailblazer | 0.9 | `trailblazer` | `trailblazer_main` | known-exact:trailblazer |
| lada | misc_a7a1745c | 0.9 | `misc_a7a1745c` | `misc_a7a1745c_main` | no-suffix |
| voyah | dream | 0.9 | `dream` | `dream_main` | known-exact:dream |
| honda | misc_8201a6dc | 0.9 | `misc_8201a6dc` | `misc_8201a6dc_main` | no-suffix |
| uaz | misc_0f7e36cf | 0.9 | `misc_0f7e36cf` | `misc_0f7e36cf_main` | no-suffix |
| haval | misc_2ca0da3c | 0.9 | `misc_2ca0da3c` | `misc_2ca0da3c_main` | no-suffix |
| jaecoo | misc_f5237550 | 0.9 | `misc_f5237550` | `misc_f5237550_main` | no-suffix |
| jaecoo | misc_1d6383a3 | 0.9 | `misc_1d6383a3` | `misc_1d6383a3_main` | no-suffix |
| kia | spectra | 0.9 | `spectra` | `spectra_main` | no-suffix |
| lada | misc_33dee471 | 0.8 | `misc_33dee471` | `misc_33dee471_main` | no-suffix |
| haval | h5 | 0.8 | `h5` | `h5_main` | known-exact:h5 |
| honda | misc_a58dc432 | 0.8 | `misc_a58dc432` | `misc_a58dc432_main` | no-suffix |
| uaz | misc_1c15a50c | 0.8 | `misc_1c15a50c` | `misc_1c15a50c_main` | no-suffix |
| uaz | misc_519e9396 | 0.8 | `misc_519e9396` | `misc_519e9396_main` | no-suffix |
| honda | freed | 0.8 | `freed` | `freed_main` | no-suffix |
| honda | fit | 0.8 | `fit` | `fit_main` | known-exact:fit |
| fiat | grande_punto_2004 | 0.8 | `grande_punto` | `grande_punto_2004` | known-prefix:grande_punto |
| changan | misc_d52243b0 | 0.8 | `misc_d52243b0` | `misc_d52243b0_main` | no-suffix |
| lada | misc_c99babc1 | 0.8 | `misc_c99babc1` | `misc_c99babc1_main` | no-suffix |
| uaz | sgr_bukhanka | 0.8 | `sgr_bukhanka` | `sgr_bukhanka_main` | no-suffix |
| renault | k9k_1_5diesel_sm | 0.7 | `k9k_1_5diesel` | `k9k_1_5diesel_sm` | code-suffix |
| uaz | misc_8aa6e2a0 | 0.7 | `misc_8aa6e2a0` | `misc_8aa6e2a0_main` | no-suffix |
| chery | maintenance_and_owner_s_manual_rus | 0.7 | `maintenance_and_owner_s_manual` | `maintenance_and_owner_s_manual_rus` | code-suffix |
| uaz | hunter | 0.7 | `hunter` | `hunter_main` | known-exact:hunter |
| lada | misc_846b194a | 0.7 | `misc_846b194a` | `misc_846b194a_main` | no-suffix |
| volvo | 440_460_480 | 0.7 | `440_460_480` | `440_460_480_main` | no-suffix |
| peugeot | 3008 | 0.7 | `3008` | `3008_main` | known-exact:3008 |
| belgee | x50plus | 0.7 | `x50plus` | `x50plus_main` | no-suffix |
| geely | misc_a4380e13 | 0.7 | `misc_a4380e13` | `misc_a4380e13_main` | no-suffix |
| livan | 2008 | 0.7 | `2008` | `2008_main` | no-suffix |
| chery | bonus_maintenance_and_owner_s_manual_rus | 0.7 | `bonus` | `bonus_maintenance_and_owner_s_manual_rus` | known-prefix:bonus |
| jac | s5 | 0.7 | `s5` | `s5_main` | no-suffix |
| peugeot | 508 | 0.6 | `508` | `508_main` | known-exact:508 |
| ford | 2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us_09_2020 | 0.6 | `2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us_09` | `2021_ford_mustang_mach_e_owners_manual_version_1_om_en_us_09_2020` | year-suffix |
| uaz | misc_3ee739b1 | 0.6 | `misc_3ee739b1` | `misc_3ee739b1_main` | no-suffix |
| datsun | datsun_1000_1200_1972 | 0.6 | `1000_1200` | `1000_1200_1972` | year-suffix |
| datsun | 1000_v2_ru_reocr | 0.6 | `1000_v2_ru_reocr` | `1000_v2_ru_reocr_main` | no-suffix |
| honda | city | 0.6 | `city` | `city_main` | no-suffix |
| lada | misc_a1081d71 | 0.6 | `misc_a1081d71` | `misc_a1081d71_main` | no-suffix |
| lada | misc_63d05cf7 | 0.6 | `misc_63d05cf7` | `misc_63d05cf7_main` | no-suffix |
| porsche | 911 | 0.5 | `911` | `911_main` | known-exact:911 |
| jac | jac_s5_ru_manual | 0.5 | `s5_ru_manual` | `s5_ru_manual_main` | no-suffix |
| subaru | impreza | 0.5 | `impreza` | `impreza_main` | known-exact:impreza |
| porsche | porsche_911_1972_1983 | 0.5 | `911` | `911_1972_1983` | known-prefix:911 |
| honda | misc_75a329b1 | 0.5 | `misc_75a329b1` | `misc_75a329b1_main` | no-suffix |
| kaiyi | misc_4b5cc04f | 0.5 | `misc_4b5cc04f` | `misc_4b5cc04f_main` | no-suffix |
| honda | misc_4d6339e6 | 0.5 | `misc_4d6339e6` | `misc_4d6339e6_main` | no-suffix |
| toyota | avensis_2 | 0.5 | `avensis` | `avensis_2` | known-prefix:avensis |
| fiat | grande_punto | 0.4 | `grande_punto` | `grande_punto_main` | known-exact:grande_punto |
| lada | misc_0278f0f2 | 0.4 | `misc_0278f0f2` | `misc_0278f0f2_main` | no-suffix |
| honda | prelude | 0.4 | `prelude` | `prelude_main` | known-exact:prelude |
| peugeot | 206 | 0.4 | `206` | `206_main` | known-exact:206 |
| renault | master | 0.4 | `master` | `master_main` | known-exact:master |
| lada | misc_68e1f39f | 0.4 | `misc_68e1f39f` | `misc_68e1f39f_main` | no-suffix |
| chevrolet | lacetti_2010 | 0.3 | `lacetti` | `lacetti_2010` | known-prefix:lacetti |
| toyota | prius_v2_ru_reocr | 0.3 | `prius` | `prius_v2_ru_reocr` | known-prefix:prius |
| lada | misc_28becbec | 0.3 | `misc_28becbec` | `misc_28becbec_main` | no-suffix |
| lada | misc_fe8ef99d | 0.2 | `misc_fe8ef99d` | `misc_fe8ef99d_main` | no-suffix |
| honda | accord_baxa_maxa_prelude_m6ha | 0.2 | `accord` | `accord_baxa_maxa_prelude_m6ha` | known-prefix:accord |
| chevrolet | lacetti | 0.2 | `lacetti` | `lacetti_main` | known-exact:lacetti |
| lada | misc_ec6a8d2c | 0.2 | `misc_ec6a8d2c` | `misc_ec6a8d2c_main` | no-suffix |
| kia | all | 0.1 | `all` | `all_main` | no-suffix |
| lada | misc_2740b293 | 0.1 | `misc_2740b293` | `misc_2740b293_main` | no-suffix |
| peugeot | 206_2002 | 0.1 | `206` | `206_2002` | known-prefix:206 |
| audi | misc_bd3f1304 | 0.1 | `misc_bd3f1304` | `misc_bd3f1304_main` | no-suffix |
| audi | misc_ac6cbbdd | 0.1 | `misc_ac6cbbdd` | `misc_ac6cbbdd_main` | no-suffix |
| uaz | misc_d3713e3e | 0.1 | `misc_d3713e3e` | `misc_d3713e3e_main` | no-suffix |
| byd | misc_76b7520c | 0.1 | `misc_76b7520c` | `misc_76b7520c_main` | no-suffix |
| voyah | ekgnqf_voyah_dream_s4_ekrannaa_versia_13 | 0.1 | `ekgnqf_voyah_dream_s4_ekrannaa_versia_13` | `ekgnqf_voyah_dream_s4_ekrannaa_versia_13_main` | no-suffix |
| uaz | profi | 0.0 | `profi` | `profi_main` | known-exact:profi |
| jetour | t2 | 0.0 | `t2` | `t2_main` | known-exact:t2 |
| kia | venga | 0.0 | `venga` | `venga_main` | known-exact:venga |
| forthing | m4 | 0.0 | `m4` | `m4_main` | no-suffix |
| mazda | 3_series | 0.0 | `3` | `3_series` | known-prefix:3 |

## merge_with_existing (4)

| brand | src_dir | size MB | target model | target gen | reason |
|---|---|---:|---|---|---|
| chery | tiggo_4_pro | 14.5 | `tiggo4_pro` | `tiggo_4_pro` | from top_cand (merge_with_existing) |
| byd | dolphin_ru_2021 | 1.2 | `dolphin` | `dolphin_ru_2021` | from top_cand (merge_with_existing) |
| forthing | friday_rhd | 0.8 | `friday` | `friday_rhd` | from top_cand (merge_with_existing) |
| byd | tang_dm_ev_en_2019 | 0.1 | `tang` | `tang_dm_ev` | from top_cand (merge_with_existing) |

## new_brand (27)

| brand | src_dir | size MB | target model | target gen | reason |
|---|---|---:|---|---|---|
| li | l7 | 6.8 | `l7` | `l7_main` | known-exact:l7 |
| mercedes_benz | 190_w201 | 5.4 | `190_w201` | `190_w201_main` | no-suffix |
| mercedes_benz | e_class_w211 | 3.4 | `e_class` | `e_class_w211` | known-prefix:e_class |
| mercedes_benz | ml_w164 | 2.1 | `ml_w164` | `ml_w164_main` | no-suffix |
| mercedes_benz | gle_coupe | 2.1 | `gle` | `gle_coupe` | known-prefix:gle |
| li | l9 | 1.3 | `l9` | `l9_main` | known-exact:l9 |
| mercedes_benz | gl_class | 1.3 | `gl_class` | `gl_class_main` | no-suffix |
| bestune | b70 | 1.1 | `b70` | `b70_main` | no-suffix |
| mercedes_benz | vito | 1.1 | `vito` | `vito_main` | known-exact:vito |
| bestune | bestune_t90 | 1.1 | `t90` | `t90_main` | no-suffix |
| li | misc_1503a4f7 | 1.0 | `misc_1503a4f7` | `misc_1503a4f7_main` | no-suffix |
| li | l8 | 0.9 | `l8` | `l8_main` | known-exact:l8 |
| mercedes_benz | 190 | 0.8 | `190` | `190_main` | no-suffix |
| mercedes_benz | m_class | 0.6 | `m_class` | `m_class_main` | known-exact:m_class |
| mercedes_benz | viano | 0.5 | `viano` | `viano_main` | known-exact:viano |
| mercedes_benz | misc_10f87275 | 0.1 | `misc_10f87275` | `misc_10f87275_main` | no-suffix |
| li | misc_09e77272 | 0.1 | `misc_09e77272` | `misc_09e77272_main` | no-suffix |
| li | misc_bb1d5d1f | 0.1 | `misc_bb1d5d1f` | `misc_bb1d5d1f_main` | no-suffix |
| mercedes_benz | g_class_w460_w463 | 0.0 | `g_class` | `g_class_w460_w463` | known-prefix:g_class |
| mercedes_benz | a_class_w177 | 0.0 | `a_class` | `a_class_w177` | known-prefix:a_class |
| mercedes_benz | c_class_w205 | 0.0 | `c_class` | `c_class_w205` | known-prefix:c_class |
| mercedes_benz | c_class_w206 | 0.0 | `c_class` | `c_class_w206` | known-prefix:c_class |
| mercedes_benz | e_class_w213 | 0.0 | `e_class` | `e_class_w213` | known-prefix:e_class |
| mercedes_benz | s_class_w223 | 0.0 | `s_class` | `s_class_w223` | known-prefix:s_class |
| mercedes_benz | vito_viano_w638 | 0.0 | `vito` | `vito_viano_w638` | known-prefix:vito |
| mercedes_benz | a_class_w168 | 0.0 | `a_class` | `a_class_w168` | known-prefix:a_class |
| mercedes_benz | ml | 0.0 | `ml` | `ml_main` | no-suffix |

## review_merge (56)

| brand | src_dir | size MB | target model | target gen | reason |
|---|---|---:|---|---|---|
| opel | insignia | 18.2 | `insignia_b` | `insignia` | from top_cand (review_merge) |
| subaru | legacy_outback_2017 | 10.9 | `outback` | `legacy_outback_2017` | from top_cand (review_merge) |
| subaru | legacy_outback_2012 | 9.4 | `outback` | `legacy_outback_2012` | from top_cand (review_merge) |
| mitsubishi | pajero | 7.8 | `pajero_sport` | `pajero` | from top_cand (review_merge) |
| mazda | cx_9 | 6.7 | `cx9` | `cx_9` | from top_cand (review_merge) |
| land_rover | range_rover_evoque | 6.7 | `range_rover_sport` | `range_rover_evoque` | from top_cand (review_merge) |
| nissan | latio_versa_almera_sunny_2011_2012_n17 | 6.3 | `almera` | `latio_versa_almera_sunny_2011_2012_n17` | from top_cand (review_merge) |
| chery | tiggo7pro | 6.1 | `tiggo_7_pro` | `tiggo7pro` | from top_cand (review_merge) |
| haval | f7x | 5.5 | `f7` | `f7x` | from top_cand (review_merge) |
| chery | tiggo_4 | 4.5 | `tiggo_7_pro` | `tiggo_4` | from top_cand (review_merge) |
| suzuki | grand_vitara_2008 | 4.3 | `vitara` | `grand_vitara_2008` | from top_cand (review_merge) |
| exeed | tx | 4.2 | `txl` | `tx` | from top_cand (review_merge) |
| chery | tiggo_8 | 4.2 | `tiggo_7_pro` | `tiggo_8` | from top_cand (review_merge) |
| opel | corsa_d | 3.8 | `corsa_e` | `corsa_d` | from top_cand (review_merge) |
| opel | astra_j | 3.6 | `astra_k` | `astra_j` | from top_cand (review_merge) |
| renault | dacia_sandero_2008 | 3.4 | `sandero` | `dacia_sandero_2008` | from top_cand (review_merge) |
| renault | sandero_ii_2014 | 3.2 | `sandero` | `sandero_ii_2014` | from top_cand (review_merge) |
| renault | logan_ii_2014 | 3.1 | `logan` | `logan_ii_2014` | from top_cand (review_merge) |
| ssangyong | rexton2 | 2.9 | `rexton` | `rexton2` | from top_cand (review_merge) |
| porsche | porsche_cayenne_2002_2007 | 2.8 | `cayenne` | `porsche_cayenne_2002_2007` | from top_cand (review_merge) |
| opel | astra | 2.7 | `astra_k` | `astra` | from top_cand (review_merge) |
| changan | cs55_plus_2019 | 2.7 | `cs35_plus` | `cs55_plus_2019` | from top_cand (review_merge) |
| hyundai | ioniq_5 | 2.4 | `ioniq5` | `ioniq_5` | from top_cand (review_merge) |
| toyota | prado_2002_2009 | 2.3 | `prado` | `prado_2002_2009` | from top_cand (review_merge) |
| suzuki | grand_vitara_2006_2011 | 2.3 | `vitara` | `grand_vitara_2006_2011` | from top_cand (review_merge) |
| mazda | cx_5_2021 | 2.2 | `cx5` | `cx_5_2021` | from top_cand (review_merge) |
| mazda | cx_30 | 2.0 | `cx30` | `cx_30` | from top_cand (review_merge) |
| chery | tiggo_7 | 2.0 | `tiggo_7_pro` | `tiggo_7` | from top_cand (review_merge) |
| infiniti | q60 | 2.0 | `qx60` | `q60` | from top_cand (review_merge) |
| opel | corsa | 1.9 | `corsa_e` | `corsa` | from top_cand (review_merge) |
| opel | corsa_d_2006_2010 | 1.8 | `corsa_e` | `corsa_d_2006_2010` | from top_cand (review_merge) |
| voyah | 6d3mmp__rukovodstvo_pol_zovatela__free | 1.8 | `free` | `6d3mmp__rukovodstvo_pol_zovatela__free` | from top_cand (review_merge) |
| gac | aion_y | 1.7 | `aion_lx` | `aion_y` | from top_cand (review_merge) |
| ssangyong | rukovodstvo_po_ekspluatatsii_ssangyong_actyon_sports_actyon | 1.7 | `actyon` | `rukovodstvo_po_ekspluatatsii_ssangyong_actyon_sports_actyon` | from top_cand (review_merge) |
| porsche | porsche_macan_2015_2016 | 1.6 | `macan` | `porsche_macan_2015_2016` | from top_cand (review_merge) |
| renault | renault_sandero_2_2014 | 1.5 | `sandero` | `renault_sandero_2_2014` | from top_cand (review_merge) |
| changan | cs55_plus | 1.4 | `cs35_plus` | `cs55_plus` | from top_cand (review_merge) |
| opel | astra_gtc | 1.4 | `astra_k` | `astra_gtc` | from top_cand (review_merge) |
| volkswagen | polo_2015_ru | 1.3 | `polo` | `polo_2015_ru` | from top_cand (review_merge) |
| honda | crv | 1.3 | `cr_v` | `crv` | from top_cand (review_merge) |
| skoda | skoda_octavia_3 | 1.3 | `octavia` | `skoda_octavia_3` | from top_cand (review_merge) |
| opel | astra_1998_2000 | 1.2 | `astra_k` | `astra_1998_2000` | from top_cand (review_merge) |
| hyundai | ioniq | 1.2 | `ioniq5` | `ioniq` | from top_cand (review_merge) |
| mazda | cx | 1.1 | `cx5` | `cx` | from top_cand (review_merge) |
| toyota | camry_2006_ru | 1.0 | `camry` | `camry_2006_ru` | from top_cand (review_merge) |
| land_rover | range_rover | 0.9 | `range_rover_sport` | `range_rover` | from top_cand (review_merge) |
| volkswagen | volkswagen_golf_1984_1992 | 0.7 | `golf` | `volkswagen_golf_1984_1992` | from top_cand (review_merge) |
| fiat | fiat_tipo_1988_1991 | 0.7 | `tipo` | `fiat_tipo_1988_1991` | from top_cand (review_merge) |
| mazda | cx_5 | 0.5 | `cx5` | `cx_5` | from top_cand (review_merge) |
| bmw | i3 | 0.5 | `ix3` | `i3` | from top_cand (review_merge) |
| jeep | cherokee | 0.4 | `grand_cherokee` | `cherokee` | from top_cand (review_merge) |
| forthing | forthing__friday | 0.3 | `friday` | `forthing__friday` | from top_cand (review_merge) |
| jaguar | e_pace | 0.2 | `f_pace` | `e_pace` | from top_cand (review_merge) |
| jeep | tj_wrangler_1998 | 0.2 | `wrangler` | `tj_wrangler_1998` | from top_cand (review_merge) |
| volkswagen | at_volkswagen_passat_audi_095 | 0.2 | `passat` | `at_volkswagen_passat_audi_095` | from top_cand (review_merge) |
| porsche | cayenne_coupe | 0.0 | `cayenne` | `cayenne_coupe` | from top_cand (review_merge) |
