# S27 oversize ingest + normalize — apply

**Source min size:** 10MB · **Output max size:** 80MB
**Totals:** write=57 too-big=13 no-dst=223
**Compression (write only):** 4438MB → 2016MB (×0.45)

## write (57)

| brand/src | src MB | dst | norm MB | ×ratio | top hits |
|---|---:|---|---:|---:|---|
| haval/dargo | 388.6 | haval/dargo/dargo_2022 | 81.5 | 0.21 | dita_id_strip=2606268, callout_warn=14429, callout_note=12576 |
| gac/gs8 | 287.9 | gac/gs8/gs8_2021 | 78.4 | 0.27 | dita_id_strip=1874992, callout_warn=18076, callout_note=1414 |
| jac/js4 | 272.1 | jac/js4/js4_gen1_2019 | 72.6 | 0.27 | dita_id_strip=1788829, callout_warn=19474, callout_note=4656 |
| kia/optima | 247.4 | kia/optima/jf_2015 | 75.7 | 0.31 | dita_id_strip=1384197, callout_warn=14321, multi_h1_merge=215 |
| zeekr/007 | 177.3 | zeekr/007/007_2024 | 74.1 | 0.42 | dita_id_strip=863928, callout_warn=16170, callout_note=9394 |
| mercedes_benz/c_class | 144.8 | mercedes/c_class/w204_2007 | 55.3 | 0.38 | dita_id_strip=647280, callout_warn=248, multi_h1_merge=241 |
| baic/x55 | 132.6 | baic/x55/x55_2022 | 68.3 | 0.52 | dita_id_strip=540672, multi_h1_merge=144, frontmatter_added=1 |
| bmw/2_series | 120.0 | bmw/2_series/f22_2013 | 42.6 | 0.35 | dita_id_strip=632448, callout_warn=5670, multi_h1_merge=1540 |
| nissan/almera | 110.3 | nissan/almera/g15_2013 | 39.1 | 0.35 | dita_id_strip=584325, callout_warn=3770, multi_h1_merge=1092 |
| byd/atto_3 | 108.4 | byd/atto_3/yuan_2021 | 45.2 | 0.42 | dita_id_strip=535696, callout_warn=16519, multi_h1_merge=422 |
| mitsubishi/pajero_sport_2020 | 106.8 | mitsubishi/pajero_sport/ks_2016 | 49.9 | 0.47 | dita_id_strip=387450, callout_note=13369, callout_warn=3828 |
| lexus/rx | 103.0 | lexus/rx/al20_2015 | 69.7 | 0.68 | dita_id_strip=294656, callout_note=2883, callout_warn=992 |
| toyota/prado_2002 | 97.3 | toyota/prado/prado_2002 | 67.0 | 0.69 | dita_id_strip=231672, callout_note=1836, callout_warn=837 |
| toyota/prado_2009 | 97.3 | toyota/prado/prado_2002 | 67.0 | 0.69 | dita_id_strip=231672, callout_note=1836, callout_warn=837 |
| skoda/octavia_1996 | 97.0 | skoda/octavia/a8_2020 | 50.5 | 0.52 | dita_id_strip=335374, callout_warn=629, multi_h1_merge=322 |
| bmw/x2 | 96.1 | bmw/x2/f39_2017 | 36.3 | 0.38 | dita_id_strip=541728, callout_warn=5285, multi_h1_merge=1298 |
| renault/koleos | 95.0 | renault/koleos/hy_2007 | 38.9 | 0.41 | dita_id_strip=437525, multi_h1_merge=306, callout_note=240 |
| fiat/ducato | 89.6 | fiat/ducato/x290_2014 | 49.2 | 0.55 | dita_id_strip=337896, multi_h1_merge=606, boilerplate_isbn=39 |
| nissan/qashqai_2021 | 88.0 | nissan/qashqai/j11_2014 | 48.0 | 0.55 | dita_id_strip=300375, callout_warn=4350, callout_note=2929 |
| porsche/macan | 83.4 | porsche/macan/95b_2014 | 41.6 | 0.50 | dita_id_strip=347400, multi_h1_merge=612, frontmatter_added=1 |
| changan/cs75_plus | 81.1 | changan/cs75_plus/cs75p1_2019 | 33.7 | 0.42 | dita_id_strip=353673, callout_warn=3053, callout_note=817 |
| renault/duster_2009 | 80.3 | renault/duster/duster_2010 | 52.8 | 0.66 | dita_id_strip=203203, callout_warn=4251, multi_h1_merge=2482 |
| skoda/kodiaq | 77.8 | skoda/kodiaq/ns_2016 | 33.5 | 0.43 | dita_id_strip=366525, callout_warn=2842, multi_h1_merge=920 |
| forthing/t5_evo | 74.9 | forthing/t5_evo/t5_2020 | 25.1 | 0.34 | dita_id_strip=388800, callout_warn=2891, callout_note=708 |
| renault/arkana | 74.2 | renault/arkana/rjl_2019 | 31.3 | 0.42 | dita_id_strip=334984, multi_h1_merge=216, callout_warn=96 |
| hyundai/elantra | 71.2 | hyundai/elantra/ad_2016 | 35.2 | 0.50 | dita_id_strip=288439, multi_h1_merge=258, callout_warn=74 |
| changan/uni_k | 69.1 | changan/uni_k/unik1_2021 | 33.7 | 0.49 | dita_id_strip=296032, callout_warn=3526, callout_note=1968 |
| datsun/mi_do | 68.8 | datsun/mi_do/gen_2014 | 33.0 | 0.48 | dita_id_strip=301074, multi_h1_merge=336, callout_warn=74 |
| volkswagen/polo_2015 | 60.0 | volkswagen/polo/polo_2015 | 38.3 | 0.64 | dita_id_strip=165228, callout_warn=4617, multi_h1_merge=112 |
| toyota/highlander | 56.4 | toyota/highlander/xu70_2019 | 38.6 | 0.68 | dita_id_strip=136416, callout_note=1134, callout_warn=351 |
| toyota/prado_1996 | 53.1 | toyota/prado/prado_2002 | 36.8 | 0.69 | dita_id_strip=125048, callout_note=459, callout_warn=270 |
| gac/gs3 | 52.0 | gac/gs3/gs3_2020 | 27.9 | 0.54 | dita_id_strip=215460, callout_warn=5985, callout_note=315 |
| volvo/s60 | 50.4 | volvo/s60/p_2018 | 39.3 | 0.78 | dita_id_strip=100816, callout_note=4492, callout_warn=10 |
| bmw/x3 | 44.5 | bmw/x3/f25_2010 | 36.0 | 0.81 | dita_id_strip=70452, callout_warn=1488, callout_note=136 |
| forthing/friday | 44.4 | forthing/friday/friday_rhd | 13.1 | 0.30 | dita_id_strip=255588, callout_warn=4255, multi_h1_merge=100 |
| baic/x35 | 40.9 | baic/x35/x35 | 27.8 | 0.68 | dita_id_strip=115922, multi_h1_merge=96, frontmatter_added=1 |
| forthing/t5 | 38.7 | forthing/t5/t5_2022 | 19.3 | 0.50 | dita_id_strip=169309, callout_warn=1628, multi_h1_merge=102 |
| bmw/x5 | 35.0 | bmw/x5/f15_2013 | 25.6 | 0.73 | dita_id_strip=78912, callout_warn=1808, callout_note=376 |
| gac/emkoo | 33.3 | gac/emkoo/gen_2022 | 12.9 | 0.39 | dita_id_strip=177228, callout_warn=3990, callout_note=1155 |
| toyota/alphard | 31.9 | toyota/alphard/ah30_2015 | 22.6 | 0.71 | dita_id_strip=70955, callout_note=858, callout_warn=209 |
| renault/sandero_2008 | 31.2 | renault/sandero/b52_2014 | 24.3 | 0.78 | dita_id_strip=51009, callout_note=3120, callout_warn=2028 |
| renault/kaptur_2016 | 30.4 | renault/kaptur/hha_2016 | 23.1 | 0.76 | dita_id_strip=54488, callout_warn=1963, multi_h1_merge=298 |
| renault/duster_2015 | 29.9 | renault/duster/duster_2010 | 23.0 | 0.77 | dita_id_strip=51597, callout_warn=2210, multi_h1_merge=212 |
| infiniti/q50 | 25.1 | infiniti/q50/v37_2013 | 18.0 | 0.72 | dita_id_strip=57930, callout_warn=1730, callout_note=1418 |
| infiniti/qx70 | 24.6 | infiniti/qx70/s51_2013 | 17.5 | 0.71 | dita_id_strip=56672, callout_warn=1752, callout_note=1206 |
| geely/tugella | 22.6 | geely/tugella/fy11_2020 | 12.8 | 0.57 | dita_id_strip=76827, multi_h1_merge=138, callout_warn=30 |
| daewoo/matiz | 21.9 | daewoo/matiz/daewoo_matiz__matiz | 18.1 | 0.83 | dita_id_strip=29625, callout_note=1485, callout_warn=1287 |
| exeed/txl | 20.2 | exeed/txl/txl1_2020 | 12.0 | 0.59 | dita_id_strip=68642, callout_warn=1276, multi_h1_merge=120 |
| gac/gs5 | 19.6 | gac/gs5/gs5 | 10.4 | 0.53 | dita_id_strip=78365, callout_warn=1141, callout_note=660 |
| zeekr/001 | 19.0 | zeekr/001/001_2021 | 11.2 | 0.59 | dita_id_strip=68208, callout_warn=1836, callout_note=1566 |
| infiniti/qx50 | 18.9 | infiniti/qx50/j55_2017 | 13.5 | 0.71 | dita_id_strip=43682, callout_warn=1276, callout_note=1048 |
| fiat/tipo | 18.9 | fiat/tipo/356_2015 | 11.2 | 0.59 | dita_id_strip=63024, multi_h1_merge=67, frontmatter_added=1 |
| daewoo/nexia | 18.0 | daewoo/nexia/daewoo_nexia__stub | 14.6 | 0.81 | dita_id_strip=27775, callout_warn=1341, multi_h1_merge=320 |
| jac/js6 | 17.5 | jac/js6/js6_gen1_2021 | 9.4 | 0.53 | dita_id_strip=69363, callout_note=1605, callout_warn=720 |
| gac/gs4 | 16.4 | gac/gs4/gs4_2020 | 9.1 | 0.55 | dita_id_strip=62764, callout_warn=1891, callout_note=675 |
| daewoo/gentra | 11.9 | daewoo/gentra/daewoo_gentra__stub | 10.8 | 0.91 | dita_id_strip=8050, multi_h1_merge=28, frontmatter_added=1 |
| chery/tiggo_8_pro | 11.4 | chery/tiggo_8_pro/t8p_2021 | 9.7 | 0.85 | dita_id_strip=14950, callout_warn=670, frontmatter_added=1 |

## too-big (requires split or aggressive dedup — S28) (13)

| brand/src | src MB | dst | norm MB | ×ratio | top hits |
|---|---:|---|---:|---:|---|
| mitsubishi/lancer | 1041.0 | mitsubishi/lancer/cy_2007 | 133.2 | 0.13 | dita_id_strip=6905347, callout_note=2997, multi_h1_merge=2066 |
| nissan/teana | 852.1 | nissan/teana/j32_2008 | 185.0 | 0.22 | dita_id_strip=5604078, callout_warn=41895, callout_note=9025 |
| lexus/lx | 792.8 | lexus/lx/j200_2007 | 256.0 | 0.32 | dita_id_strip=4785398, callout_note=11340, callout_warn=3766 |
| daewoo/lacetti | 759.8 | daewoo/lacetti/gen_2002 | 204.5 | 0.27 | dita_id_strip=4517852, callout_note=25875, callout_warn=14720 |
| audi/a8 | 659.6 | audi/a8/d5_2017 | 149.5 | 0.23 | dita_id_strip=4603312, callout_warn=26894, callout_note=20706 |
| kia/soul | 613.1 | kia/soul/ps_2014 | 204.8 | 0.33 | dita_id_strip=3582800, callout_note=7622, callout_warn=7519 |
| volkswagen/touareg | 535.3 | volkswagen/touareg/cr_2018 | 137.9 | 0.26 | dita_id_strip=3130495, callout_note=22692, callout_warn=9429 |
| tank/500 | 411.0 | tank/500/gen_2022 | 98.4 | 0.24 | dita_id_strip=2770000, callout_warn=21186, callout_note=18117 |
| gac/gn8 | 368.3 | gac/gn8/gn8 | 92.4 | 0.25 | dita_id_strip=2469444, callout_warn=20390, callout_note=6363 |
| exeed/lx | 367.6 | exeed/lx/lx1_2019 | 100.6 | 0.27 | dita_id_strip=2388327, callout_warn=10062, multi_h1_merge=212 |
| changan/uni_t | 362.0 | changan/uni_t/unit1_2020 | 93.7 | 0.26 | dita_id_strip=2243096, callout_warn=9126, callout_note=4563 |
| fiat/500 | 336.4 | fiat/500/312_2007 | 106.6 | 0.32 | dita_id_strip=1912635, callout_note=14127, multi_h1_merge=4593 |
| exeed/vx | 290.7 | exeed/vx/vx1_2020 | 88.1 | 0.30 | dita_id_strip=1812818, callout_warn=7346, multi_h1_merge=128 |

## no-dst (no matching brand/model/gen in KB) (223)

| brand/src | src MB | dst | norm MB | ×ratio | top hits |
|---|---:|---|---:|---:|---|
| honda/accord-98 | 1637.4 | — | — | — |  |
| exeed/rx | 1139.9 | — | — | — |  |
| ford/transit | 1019.5 | — | — | — |  |
| porsche/cayenne-955 | 967.1 | — | — | — |  |
| peugeot/partner | 830.7 | — | — | — |  |
| infiniti/fx35 | 797.5 | — | — | — |  |
| mitsubishi/outlander-02 | 730.9 | — | — | — |  |
| ford/galaxy | 658.1 | — | — | — |  |
| hyundai/tucson-2007 | 625.8 | — | — | — |  |
| volkswagen/id5 | 602.7 | — | — | — |  |
| nissan/serena | 573.6 | — | — | — |  |
| volkswagen/jetta | 550.7 | — | — | — |  |
| toyota/camry-2001 | 548.0 | — | — | — |  |
| nissan/murano-z50 | 538.5 | — | — | — |  |
| toyota/camry-xv30 | 513.9 | — | — | — |  |
| volkswagen/multivan_t5 | 506.3 | — | — | — |  |
| volkswagen/id4 | 484.0 | — | — | — |  |
| toyota/camry-vista-83 | 467.0 | — | — | — |  |
| toyota/camry-v40 | 437.0 | — | — | — |  |
| toyota/camry-gracia | 430.7 | — | — | — |  |
| volkswagen/passat_b6 | 421.1 | — | — | — |  |
| toyota/camry-vista-94 | 405.5 | — | — | — |  |
| honda/airwave | 403.5 | — | — | — |  |
| byd/song_plus | 398.2 | — | — | — |  |
| opel/calibra | 354.7 | — | — | — |  |
| nissan/note | 337.3 | — | — | — |  |
| ford/c_max | 324.5 | — | — | — |  |
| mitsubishi/l300_delica | 322.2 | — | — | — |  |
| ford/taurus | 319.5 | — | — | — |  |
| peugeot/5008 | 302.6 | — | — | — |  |
| zeekr/9x | 301.5 | — | — | — |  |
| mitsubishi/lancer_x | 294.9 | — | — | — |  |
| gac/s9 | 282.9 | — | — | — |  |
| suzuki/ignis | 271.0 | — | — | — |  |
| haval/m6 | 263.3 | — | — | — |  |
| volkswagen/id6 | 262.9 | — | — | — |  |
| mazda/cx_7 | 249.9 | — | — | — |  |
| nissan/skyline | 249.4 | — | — | — |  |
| citroen/berlingo | 241.7 | — | — | — |  |
| jaguar/xj6 | 234.0 | — | — | — |  |
| volvo/240 | 232.4 | — | — | — |  |
| nissan/altima | 218.2 | — | — | — |  |
| fiat/doblo | 209.1 | — | — | — |  |
| honda/accord_2013 | 207.3 | — | — | — |  |
| nissan/navara | 203.9 | — | — | — |  |
| renault/clio | 199.8 | — | — | — |  |
| byd/yuan_up | 195.0 | — | — | — |  |
| ford/fiesta | 194.2 | — | — | — |  |
| byd/song_l | 190.4 | — | — | — |  |
| renault/clio_iii | 179.2 | — | — | — |  |
| renault/laguna_iii | 175.7 | — | — | — |  |
| nissan/patrol | 174.3 | — | — | — |  |
| land_rover/discovery | 159.8 | — | — | — |  |
| volvo/340 | 157.3 | — | — | — |  |
| opel/mokka | 152.0 | — | — | — |  |
| volkswagen/sharan | 150.1 | — | — | — |  |
| fiat/albea | 148.4 | — | — | — |  |
| chevrolet/tracker | 147.6 | — | — | — |  |
| kia/optima_k5 | 146.4 | — | — | — |  |
| byd/song_plus_pfi | 141.6 | — | — | — |  |
| nissan/maxima | 141.6 | — | — | — |  |
| mitsubishi/montero | 135.5 | — | — | — |  |
| mitsubishi/pajero_iv | 134.1 | — | — | — |  |
| citroen/c_crosser | 127.4 | — | — | — |  |
| toyota/camry-2006 | 126.6 | — | — | — |  |
| volkswagen/golf3 | 114.0 | — | — | — |  |
| honda/edix | 108.1 | — | — | — |  |
| lexus/rx350 | 104.8 | — | — | — |  |
| toyota/tundra | 104.5 | — | — | — |  |
| renault/scenic_ii | 103.5 | — | — | — |  |
| opel/grandland | 103.5 | — | — | — |  |
| chevrolet/suburban | 102.1 | — | — | — |  |
| volkswagen/transporter | 101.3 | — | — | — |  |
| volkswagen/caravelle | 99.9 | — | — | — |  |
| hyundai/matrix | 99.5 | — | — | — |  |
| hyundai/getz | 95.0 | — | — | — |  |
| geely/galaxy | 93.2 | — | — | — |  |
| opel/zafira | 92.7 | — | — | — |  |
| chevrolet/tahoe | 92.5 | — | — | — |  |
| porsche/panamera | 89.9 | — | — | — |  |
| mazda/323 | 88.8 | — | — | — |  |
| nissan/qashqai_j11 | 87.6 | — | — | — |  |
| toyota/hilux_2011 | 86.6 | — | — | — |  |
| lexus/rx300 | 86.1 | — | — | — |  |
| toyota/hilux | 85.8 | — | — | — |  |
| toyota/corolla_ax | 85.3 | — | — | — |  |
| forthing/t5_hev | 83.8 | — | — | — |  |
| changan/cs95 | 80.8 | — | — | — |  |
| toyota/mark_2 | 79.1 | — | — | — |  |
| chevrolet/malibu | 76.9 | — | — | — |  |
| toyota/hiace | 71.9 | — | — | — |  |
| mitsubishi/delica | 71.4 | — | — | — |  |
| volkswagen/golf_6 | 70.4 | — | — | — |  |
| changan/cs75 | 70.2 | — | — | — |  |
| skoda/octavia_3 | 69.4 | — | — | — |  |
| honda/fit_jazz | 65.1 | — | — | — |  |
| subaru/tribeca | 64.3 | — | — | — |  |
| honda/jazz | 64.0 | — | — | — |  |
| renault/fluence | 63.4 | — | — | — |  |
| changan/eado | 63.3 | — | — | — |  |
| skoda/felicia | 62.9 | — | — | — |  |
| mazda/tribute | 62.8 | — | — | — |  |
| honda/odyssey | 62.3 | — | — | — |  |
| byd/song | 61.3 | — | — | — |  |
| chevrolet/traverse | 60.6 | — | — | — |  |
| mazda/626 | 60.2 | — | — | — |  |
| byd/t03 | 60.0 | — | — | — |  |
| jac/s3 | 59.6 | — | — | — |  |
| volvo/xc70 | 58.2 | — | — | — |  |
| toyota/crown | 57.8 | — | — | — |  |
| byd/sea_lion | 57.0 | — | — | — |  |
| honda/crosstour | 55.3 | — | — | — |  |
| mitsubishi/colt | 54.5 | — | — | — |  |
| mini/hatch | 54.0 | — | — | — |  |
| datsun/1000 | 53.8 | — | — | — |  |
| toyota/caldina | 53.0 | — | — | — |  |
| mazda/mpv | 52.4 | — | — | — |  |
| geely/emgrand | 51.0 | — | — | — |  |
| renault/megane_scenic_ii | 49.6 | — | — | — |  |
| citroen/c3 | 48.9 | — | — | — |  |
| porsche/cayenne_coupe_e3 | 44.8 | — | — | — |  |
| porsche/cayenne_e3 | 44.1 | — | — | — |  |
| nissan/sentra | 44.1 | — | — | — |  |
| renault/megane_scenic_i | 41.4 | — | — | — |  |
| nissan/wingroad | 40.6 | — | — | — |  |
| opel/frontera | 40.6 | — | — | — |  |
| kia/magentis | 40.4 | — | — | — |  |
| chery/tiggo_2 | 39.9 | — | — | — |  |
| renault/symbol_thalia | 38.7 | — | — | — |  |
| nissan/cube | 37.3 | — | — | — |  |
| voyah/dreamer | 37.1 | — | — | — |  |
| renault/laguna_ii | 37.0 | — | — | — |  |
| geely/mk | 36.5 | — | — | — |  |
| hyundai/porter | 35.9 | — | — | — |  |
| opel/vivaro | 35.3 | — | — | — |  |
| honda/stream | 35.3 | — | — | — |  |
| subaru/wrx | 33.9 | — | — | — |  |
| toyota/corona | 33.7 | — | — | — |  |
| toyota/sequoia | 33.7 | — | — | — |  |
| subaru/xv | 33.6 | — | — | — |  |
| nissan/micra | 33.6 | — | — | — |  |
| nissan/bluebird | 33.4 | — | — | — |  |
| voyah/taishan | 33.0 | — | — | — |  |
| honda/pilot_2003 | 32.2 | — | — | — |  |
| mitsubishi/grandis | 31.4 | — | — | — |  |
| volkswagen/sharan_2 | 30.6 | — | — | — |  |
| renault/symbol | 30.5 | — | — | — |  |
| toyota/supra | 30.3 | — | — | — |  |
| renault/sandero_ii | 30.1 | — | — | — |  |
| volkswagen/tiguan_2 | 29.8 | — | — | — |  |
| renault/logan_ii | 29.2 | — | — | — |  |
| toyota/noah | 28.9 | — | — | — |  |
| renault/safrane | 28.7 | — | — | — |  |
| chery/bonus | 28.3 | — | — | — |  |
| changan/qiyuan_q07 | 28.2 | — | — | — |  |
| renault/twingo | 28.0 | — | — | — |  |
| renault/megane_ii | 27.9 | — | — | — |  |
| toyota/celica | 26.4 | — | — | — |  |
| honda/hrv_1999 | 26.2 | — | — | — |  |
| mazda/tribute_2000 | 26.1 | — | — | — |  |
| honda/odyssey_1999 | 25.8 | — | — | — |  |
| mazda/mazda3_2003 | 25.6 | — | — | — |  |
| honda/crv_2001 | 25.6 | — | — | — |  |
| mazda/mazda6_2002 | 24.3 | — | — | — |  |
| peugeot/607 | 23.9 | — | — | — |  |
| fiat/stilo | 23.9 | — | — | — |  |
| changan/qiyuan_q05 | 23.4 | — | — | — |  |
| chevrolet/lanos | 23.4 | — | — | — |  |
| honda/stream_2000 | 22.4 | — | — | — |  |
| toyota/premio | 21.8 | — | — | — |  |
| byd/qin | 21.7 | — | — | — |  |
| chevrolet/epica | 21.6 | — | — | — |  |
| suzuki/grand_vitara | 21.5 | — | — | — |  |
| infiniti/qx80 | 20.6 | — | — | — |  |
| daewoo/lanos | 20.4 | — | — | — |  |
| mazda/323_1998 | 20.3 | — | — | — |  |
| volkswagen/multivan | 20.2 | — | — | — |  |
| chery/qq | 20.1 | — | — | — |  |
| daewoo/espero | 19.9 | — | — | — |  |
| volkswagen/transporter_2 | 19.9 | — | — | — |  |
| volkswagen/touareg_2 | 19.8 | — | — | — |  |
| volkswagen/caravelle_2 | 19.7 | — | — | — |  |
| mazda/626_1997 | 19.5 | — | — | — |  |
| changan/qiyuan_a05 | 19.3 | — | — | — |  |
| volkswagen/passat_2 | 19.0 | — | — | — |  |
| toyota/avalon | 19.0 | — | — | — |  |
| mazda/mpv_1999 | 18.8 | — | — | — |  |
| suzuki/liana | 18.7 | — | — | — |  |
| toyota/prius | 18.6 | — | — | — |  |
| gac/empow | 18.5 | — | — | — |  |
| opel/insignia | 18.5 | — | — | — |  |
| mazda/premacy_1999 | 17.5 | — | — | — |  |
| volvo/850 | 17.5 | — | — | — |  |
| renault/clio_iii_2005 | 17.5 | — | — | — |  |
| renault/laguna_iii_2009 | 17.4 | — | — | — |  |
| jac/t8 | 16.9 | — | — | — |  |
| renault/clio_symbol | 16.3 | — | — | — |  |
| geely/preface | 16.1 | — | — | — |  |
| suzuki/vitara_escudo | 15.8 | — | — | — |  |
| chery/tiggo_4_pro | 14.8 | — | — | — |  |
| nissan/sunny | 14.8 | — | — | — |  |
| daewoo/kalos | 14.6 | — | — | — |  |
| toyota/hilux_2 | 14.5 | — | — | — |  |
| ford/ecosport | 14.4 | — | — | — |  |
| jaguar/xj | 14.2 | — | — | — |  |
| renault/kangoo | 13.8 | — | — | — |  |
| suzuki/sx4 | 13.8 | — | — | — |  |
| hyundai/galloper | 13.4 | — | — | — |  |
| mercedes_benz/sprinter | 13.2 | — | — | — |  |
| chery/7_m16_service_manual | 13.1 | — | — | — |  |
| suzuki/swift | 12.8 | — | — | — |  |
| jeep/renegade | 12.7 | — | — | — |  |
| mazda/demio_1996 | 12.4 | — | — | — |  |
| ford/mustang | 12.4 | — | — | — |  |
| voyah/courage | 12.0 | — | — | — |  |
| suzuki/baleno | 12.0 | — | — | — |  |
| chevrolet/equinox | 12.0 | — | — | — |  |
| skoda/kodiaq_2 | 11.8 | — | — | — |  |
| volkswagen/caddy | 11.8 | — | — | — |  |
| subaru/legacy_outback_2017 | 11.2 | — | — | — |  |
| geely/emgrand_ev | 11.0 | — | — | — |  |
| mazda/626mx6_1989 | 10.8 | — | — | — |  |
| renault/scenic | 10.6 | — | — | — |  |
