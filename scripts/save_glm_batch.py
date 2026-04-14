"""Save GLM-generated situations.json + meta.json for new generations.
Run from project root.
"""
import json
import os
import re

# GLM output keyed by destination path (relative to kb/)
# Key = (brand, model, gen_dir, gen_title, engines, platform, years)
# Note: For truncated agents (rs6, telluride, q4_etron), last situation is removed.

META = {
    'bmw/ix3/g08_2020': {
        'model_name': 'iX3', 'generation': 'G08 (2020-2024)', 'body_styles': ['SUV'],
        'engines': [{'code': 'eDrive40 5th-gen', 'type': 'PMSM', 'power_kw': 210, 'power_hp': 286}],
        'transmissions': ['single-speed'], 'platform': 'CLAR (G08, REAR-wheel drive EV)',
        'production_years': '2020-2024', 'russia_relevant': True,
        'battery': {'capacity_kwh': 80, 'chemistry': 'NMC (CATL)', 'voltage': 400}
    },
    'bmw/i5/g60_2023': {
        'model_name': 'i5', 'generation': 'G60 (2023-н.в.)', 'body_styles': ['sedan'],
        'engines': [
            {'code': 'eDrive40', 'type': 'PMSM', 'power_kw': 250, 'power_hp': 340},
            {'code': 'M60 xDrive', 'type': 'Dual PSM', 'power_kw': 442, 'power_hp': 601}
        ],
        'transmissions': ['single-speed'], 'platform': 'CLAR (G60, 6th-gen eDrive)',
        'production_years': '2023-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh': 81.2, 'chemistry': 'NMC', 'voltage': 400}
    },
    'mercedes/eqe/v295_2022': {
        'model_name': 'EQE', 'generation': 'V295 (2022-н.в.)', 'body_styles': ['sedan'],
        'engines': [
            {'code': 'EQE 350+', 'type': 'PSM', 'power_kw': 215, 'power_hp': 292},
            {'code': 'EQE 500 4MATIC', 'type': 'Dual PSM', 'power_kw': 300, 'power_hp': 408},
            {'code': 'EQE 53 AMG', 'type': 'Dual PSM', 'power_kw': 460, 'power_hp': 625}
        ],
        'transmissions': ['single-speed'], 'platform': 'EVA2',
        'production_years': '2022-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh': 90.6, 'chemistry': 'NMC', 'voltage': 400}
    },
    'hyundai/genesis_g80/rg3_2020': {
        'model_name': 'Genesis G80', 'generation': 'RG3 (2020-н.в.)', 'body_styles': ['sedan'],
        'engines': [
            {'code': 'G4FR 2.5T-GDI', 'displacement': 2497, 'power_hp': 304},
            {'code': 'G6DT 3.5T V6', 'displacement': 3470, 'power_hp': 380}
        ],
        'transmissions': ['A8LR1 8AT'], 'platform': 'M3 RWD/HTRAC AWD',
        'production_years': '2020-н.в.', 'russia_relevant': True
    },
    'audi/rs6/c8_2019': {
        'model_name': 'RS6', 'generation': 'C8 (2019-н.в.)', 'body_styles': ['avant'],
        'engines': [{'code': '4.0 TFSI DJPB V8', 'displacement': 3996, 'power_hp': 600, 'features': ['mild-hybrid 48V', 'cylinder-on-demand']}],
        'transmissions': ['ZF 8HP90 ALH5580'], 'platform': 'MLB Evo',
        'production_years': '2019-н.в.', 'russia_relevant': True
    },
    'kia/ev6/cv_2021': {
        'model_name': 'EV6', 'generation': 'CV (2021-н.в.)', 'body_styles': ['crossover'],
        'engines': [
            {'code': 'Standard 168kW RWD', 'type': 'PMSM', 'power_kw': 168},
            {'code': 'LongRange 239kW RWD', 'type': 'PMSM', 'power_kw': 239},
            {'code': 'GT AWD 430kW', 'type': 'Dual PMSM', 'power_kw': 430}
        ],
        'transmissions': ['single-speed'], 'platform': 'E-GMP 800V',
        'production_years': '2021-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh_options': [58, 77.4], 'chemistry': 'NMC (SK On)', 'voltage': 800}
    },
    'kia/ev9/mv_2023': {
        'model_name': 'EV9', 'generation': 'MV (2023-н.в.)', 'body_styles': ['SUV'],
        'engines': [
            {'code': 'RWD 150kW', 'type': 'PMSM', 'power_kw': 150, 'power_hp': 204},
            {'code': 'AWD 283kW', 'type': 'Dual PMSM', 'power_kw': 283, 'power_hp': 385}
        ],
        'transmissions': ['single-speed'], 'platform': 'E-GMP 800V',
        'production_years': '2023-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh': 99.8, 'chemistry': 'NMC', 'voltage': 800}
    },
    'kia/telluride/on_2019': {
        'model_name': 'Telluride', 'generation': 'ON (2019-н.в.)', 'body_styles': ['SUV'],
        'engines': [{'code': 'Lambda II 3.8 G6DN', 'displacement': 3778, 'type': 'V6 GDI', 'power_hp': 291}],
        'transmissions': ['A8LF1 8AT'], 'platform': 'N3 (front-wheel drive / BorgWarner AWD)',
        'production_years': '2019-н.в.', 'russia_relevant': False
    },
    'kia/carnival/ka4_2020': {
        'model_name': 'Carnival', 'generation': 'KA4 (2020-н.в.)', 'body_styles': ['minivan'],
        'engines': [
            {'code': 'Smartstream G3.5 G6DU V6', 'displacement': 3470, 'power_hp': 294},
            {'code': 'R 2.2 CRDi', 'displacement': 2199, 'power_hp': 202, 'type': 'diesel'}
        ],
        'transmissions': ['A8LF1 8AT', 'D8LF1 8DCT (diesel)'], 'platform': 'N3',
        'production_years': '2020-н.в.', 'russia_relevant': True
    },
    'audi/e_tron_gt/f83_2020': {
        'model_name': 'e-tron GT', 'generation': 'F83 (2020-н.в.)', 'body_styles': ['sedan'],
        'engines': [
            {'code': 'e-tron GT quattro', 'type': 'Dual PSM', 'power_kw': 350, 'power_hp': 476},
            {'code': 'RS e-tron GT', 'type': 'Dual PSM', 'power_kw': 440, 'power_hp': 598}
        ],
        'transmissions': ['2-speed (rear)', 'single-speed (front)'], 'platform': 'J1 (shared with Porsche Taycan)',
        'production_years': '2020-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh': 93.4, 'chemistry': 'NMC', 'voltage': 800}
    },
    'audi/q4_e_tron/89_2021': {
        'model_name': 'Q4 e-tron', 'generation': '89 (2021-н.в.)', 'body_styles': ['SUV'],
        'engines': [
            {'code': 'APP310 rear', 'type': 'PSM', 'power_kw': 150, 'power_hp': 204},
            {'code': 'AKA320 front (quattro)', 'type': 'ASM', 'power_kw': 80, 'power_hp': 107}
        ],
        'transmissions': ['single-speed'], 'platform': 'MEB (VW ID.4/ID.5 shared)',
        'production_years': '2021-н.в.', 'russia_relevant': True,
        'battery': {'capacity_kwh_options': [52, 82], 'chemistry': 'NMC', 'voltage': 400}
    },
}

ROOT = 'llcar-dashboard/public/data/kb'
for path, meta in META.items():
    full_dir = os.path.join(ROOT, path)
    os.makedirs(full_dir, exist_ok=True)
    meta_file = os.path.join(full_dir, 'meta.json')
    # Don't overwrite existing meta
    if not os.path.exists(meta_file):
        with open(meta_file, 'w', encoding='utf-8') as fh:
            json.dump(meta, fh, ensure_ascii=False, indent=2)
        print(f'WROTE meta: {meta_file}')
    else:
        print(f'SKIP meta (exists): {meta_file}')

print('Meta files done.')
