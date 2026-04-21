---
brand: ssangyong
model: rexton
generation: gen_2017
source: kb
---

# ENGINE SERVICE MANUAL

![](images/676f644fa2aa7be89aa761fbcf786af5065c8290e5b354532ff7bbec44b2d67a.webp)

# DI ENGINE

GENEL O.DI0   
ENGINE ASSEMBLY .. I1   
ENGINE HSING.. . I02   
INTAKE SYSTEM. . I03   
EXHAUST SYSTEM. .. NI4   
LUBRION YST. D   
COOLI   
FUEL SYSTEM. .. .. I7   
ENGINE CONNTL SYSTEM.... I08   
ELECTRIC DEVICES AND SENSORS. DI09   
DIAGNIS .. 10

# GENERAL INFORMATION

CLEANNESS DIOA-3   
STRUCTURE DIOA-8   
ENG IN COTLS  M-1   
ECU related components .DIOA-11   
Engine and sensors . DIOA-12   
Electrical components and   
pre heating system DIOA-13   
INTAKE SYSTEM ... DIOA-14   
Intake air flow chart . DIOA-15   
INTAKE SYSTEM . DIOA-16   
Exhaust air flow chart . DIOA-17   
LUBRICATION SYSTEM. .. DIOA-18   
COOLING SYSTEM DIOA-19   
Coolant flow chart DIOA-20   
FUEL SYSTEM DI0A-21   
Fuel supply system . DIOA-22   
GENERAL SPECIFICATIONS. DIOA-23   
Vehicle specifications. DIOA-23   
Maintenance DIOA-26   
VEHICLE IDENTIFICATION. DIOA-28   
HOW TO USE AND MAINTAIN WORKSHOP   
MANUAL ... .. DI0A-30   
Consists of workshop manual.... DIOA-30   
Manual description DI0A-30   
Guidelines for service work   
safety DIOA-31   
Lifting points . DIOA-36   
Tightening torque of standard   
bolts.. DI0A-37

![](images/39dad067d4084dee3b607803276284a00aa86a3ed6a3b247ca05dfe7bfb9cb65.webp)

# Cleanness of DI Engine Fuel System and Service Procedures

The fuel system for Dl engine consists of transfer (low pressure) line and high pressure line. Its highest pressure reaches over 1600 bar. Some components in injector and HP pump are machined at the micrometer 100 um of preciseness. The pressure regulation and injector operation are done by electric source from engine ECU. Accordingly, if the internal valve is stucked due to foreign materials, injector remains open. Even in this case, the HP pump stil operates to supply high pressurized fuel. This increases the pressure to combustion chamber (over 250 bar) and may cause fatal damage to engine.

You can compare the thickness of injector nozzle hole and hair as shown in below figure (left side). The right side figure shows the clearance between internal operating elements.

![](images/0025ba396af0a5453e198926e7883f530b7787382aba914a730b447e7087ed47.webp)

Y220_0A035

The core elements of fuel system has very high preciseness that is easily affected by dust or very small foreign material. Therefore, make sure to keep the preliminary works and job procedures in next pages. If not, lots of system problems and claims may arise.

![](images/35b0fa5d9535768980229fbfa47de8eff1791506c0159d2eb068d1a9ab5b737c.webp)

# Job procedures

1. Always keep the workshop and lift clean (especially, from dust).

Always keep the tools clean (from oil or foreign materials).

3. Wear a clean vinyl apron to prevent the fuz, dust and foreign materials from getting into fuel system. Wash your hands and do not wear working gloves.

4Follow the below procedures before starting service works for fuel system.

Carefully listen the symptoms and problems from customer.   
V   
Visually check the leaks and vehicle appearance on the wiring harnesses   
and connectors in engine compartment.   
Perform the diagnosis proceee with Scan-i   
(refer to "DIAGNOSIS” section in this manual).   
V   
Locate the fault. If the cause is from fuel system (from priming pump to   
injector, including return line), follow the step 1 through step 3 above.

5If the problem is from HP pump, fuel supplyline or injector, prepare the clean special tools and sealing caps to perform the diagnosis for DI engine fuel system in "DIAGNOSIS” section in this manual. At this point, thoroughly clean the related area in engine compartment.

# Notice

Clean the engine compartment before starting service works.

![](images/4fdca1d205b650207795219b8cfc38d34077de5042aa6348fb053534973c5d6a.webp)

![](images/101d71ee9aea88f7b0ecc79369973499372d816418a21866a51c360c0aca685d.webp)

6Follow the job procedures. If you find a defective component, replace it with new one.

Disconnect the negative battery cable. V For safety reasons: check pressure is low before opening the HP systems (pipes) V Use special tools and torque wrench to perform the corect works.

Once disconnected, the fuel pipes between HP pump and fuel rail and between fuel rail and each injector should be replaced with new ones. The pipes should be tightened to specified tightening torques during instalation. Over or under torques out of specified range may cause damages and leaks at connections. Once installed, the pipes have been deformed according to the force during installtion, therefore they are not reusable.

The copper washer on injector should be replaced with new one. The injector holder bolt should be tightened to specified tightening torque as well. If not, the injection point may be deviated from correct position, and it may cause engine disorder.

Plug the disconnected parts with sealing caps, and remove the caps immediately before replacing the components.

![](images/9dbbee8f6f336b294d94cae06410d58fe4900808678af50c72ecbedd3203e083.webp)

![](images/d34a742332a1650f91b52f14cf13309512b9ebef4714f29f22dbeb8ab89e36fa.webp)

![](images/8e27eb4462ec6f1c785624426657556086ce1f8c42b5c5db6ddf3ba5816be7b1.webp)

7. Plug the removed components with clean and undamaged sealing caps and store it into the box to keep the conditions when it was installed. Clear the high pressure offset value by Scan-100 after replacing the high pressure pump.

![](images/cab3ca0d8d19cd8db653cf405b9d4783f854488e1ad28397dc022497d0fbda99.webp)

9. To supply the fuel to transfer line of HP pump press the priming pump until it becomes hard.

# Warning

Do not crank engine before having filled pump.

O SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
21 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8ARIANT CODIN   
9] ECU REPLACE Select one of the above items Y220_0A042   
10. Check the installed components again and connect the negative battery cable. Start the engine and check the operating status.   
11.With Scan-i, check if there are current faults and erase the history faults.

Note For details, refer to “Dl10 Diagnosis teable".

![](images/bd1da9e5ffa7f72202f53b0338241c5102b69cd933a79985d5fbd380c31c8b74.webp)

DI Engine and Its Expected Problems and Remedies Can be Caused by Water in Fuel

# SYSTEM SUPPLEMENT AGAINST PARAFFIN SEPARATION.

In case of Diesel fuel, parafin, one of the elements, can be separated from fuel during winter and then can stick on the fuel filter blocking fuel flow and causing dificult starting finally. Oil companies supply summer fuel and winter fuel by differentiating mixing ratio of kerosene and other elements by region and season. However, above phenomenon can be happened if stations have poor facilities or sellimproper fuel for the season.   
In case of DI engine, purity of fuel is very important factor to keep internal preciseness of HP pump and injector. Accordingly, more dense mesh than conventional fuel fiter is used. To prevent fuelfiter internal clogging due to parafin separation, SYMC is using fuel line that high pressure and temperature fuel injected by injector returns through fuel filter to have an effect of built-in heater (see fuel system).

# SYSTEM SUPPLEMENT AND REMEDY AGAINST WATER IN FUEL

As mentioned above, some gas stations supply fuel with excessive than specified water. In the conventional IDI engine, excessive water in the fuel only causes dropping engine power or engine hunting. However, fuel system in the DI engine consists of precise components so water in the fuel can cause malfunctions of HP pump due to poor lubrication of pump caused by poor coating film during high speed pumping and bacterization (under long period parking). To prevent problems can be caused by excessive water in fuel, water separator is installed inside of fuel filter. When fuel is passing filter, water that has relatively bigger specific gravity is accumulated on the bottom of the filter.

![](images/b5866f517caee463e98ec41dd0bd86bcb44c4c6e5ca03f35ffbbb8af4aa06887.webp)

If water in the separator on the fuel fiter exceeds a certain level, it wil be supplied to HP pump with fuel, so the engine ECU turns on warning light  on the meter cluster and buzzer if water levelis higher than a certain level. Due to engine layout, a customer cannot easily drain water from fuel filter directly, so if a customer checks in to change engine oil, be sure to perform water drain from fuel filter. (See fuel system for details.)

![](images/0d3cfbb1bfc4685e2be168ea2a0505b0026879d9d0c7f745e880b34eda30640b.webp)

# Front view

![](images/a2415358f50c7d5d5a5c40e872addfc4d3ab07227dbeb905d4faf804c24e30b2.webp)

Y220_0A001

1. TVD (Torsional Vibration Damper)

2. Air conditioner compressor

3. Power steering pump pulley

4. Idle pulley

5. Water pump pulley

6. Alternator

7.Cooling fan pully & viscos clutch 13. Oil filter housing

8. Aut tensioner pulley

9. Auto tensioner

10. Poly-groove belt

11. Cam position sensor

12. Drive plate (M/T: DMF)

14. Vacuum pump   
15. Crank position sensor   
16. EGR valve   
17. Power steering pump   
18. EGR center pipe

![](images/fe58dfab9b317a797b7830611e84c5b95114921d189b865e6f9f07393cbd8d92.webp)

# Top view

![](images/1ba9587de37ab66850874c3faddb766a830bd7623174186e3860d5214be1d397.webp)

Y220_0A002

19. Cylinder head cover   
20. Intake manifold   
21. Water outlet port   
22. Common rail   
23. Fuel pressure sensor   
24. Fuel pipe   
25. Injector   
26. Fuel return line   
27. Oil filler cap   
28. Glow plug   
29. Booster pressure sensor   
30. Oil separator   
31. Oil dipstic   
32. EGR center pipe

![](images/c766e3ec4fd469047c23672ebaca39d1bc25f72dfd453501ec38ef83074e0c41.webp)

![](images/16755d2e01ea4882321b22f2ee452394a0b29f46a50686ad7421fea8866656d3.webp)

Y220_0A003

33. Cylinder head   
34. Cylinder block   
35. Oil pan   
36. Drain plug   
37. Turbocharger

38. EGR - RH pipe

39. Oil separator

40. Oil dipstic

41. HP pump

42. Turbocharger vacuum modulator   
43. EGR valve vacuum modulator   
44. EGR valve   
45. Exhaust manifold

![](images/107a71e9a01a8840ea9763ce5a68265620a9cf9a28d3be0023938d88dafe99e6.webp)

# ECU RELATED COMPONENTS

![](images/331d5f2f496dbc544f6485fc9ec2dc4f185490ced79c2696a1b9508585e73f1d.webp)

![](images/4b9c531920005af526d8c8776a11e2ca375240bdbd89390ee19a227d2c3c6e0e.webp)

# ENGINE AND SENSORS

![](images/6e7eeb14aaf20443ca87dbdcabb5cd4c57fd05894430985aee83050152c1347c.webp)

Y220_0A005

![](images/1c9a82a6ec37889714814ab80d0daf79c9175857667eb32f962f8db6702b9860.webp)

# ELECTRICAL COMPONENTS AND PRE HEATING SYSTEM

![](images/77abb0549e95a4619698e92e5e5968cdeba1581c86e5dbd48bfa78dd1f367bb6.webp)

![](images/491a81082f8eef904a556c3cf7acf3d1e85507fc108bd58afa875aeccaa155b6.webp)

# INTAKE SYSTEM

![](images/2f0078b0f94e801c64fe7047d73bc85e947b85a1bdf22aef5b2a7b674682bf7f.webp)

![](images/f27c239d301af145dc67f25ff225318c844b0f1e1c3e212dca680269d131fdc4.webp)

# INTAKE AIR FLOW CHART

![](images/4f636625cafd46ad92a88697b6ad8e4ec469f4ae010753db10cd14f22e9032b8.webp)

Y220_0A008

![](images/d2b86bb456592a08c920c31ba57d4ecba7c62b336d34daf3285766739493adfa.webp)

![](images/e7da09f5c4d98af673a860c21a3eb53eb7cd19b6d5cd863d688adcfa6af6a27b.webp)

![](images/9e621894a5bb0963956d7f899e51c15932e1677297737bbeb26aa3f154d82e33.webp)

# EXHAUST AIR FLOW CHART

![](images/f251df62ff5435ce075b1b33154af579967457e021e8ef3aa5f1bb9721b2716a.webp)

Y220_0A010

![](images/f6b3a1bb4aaaf8666b3fc6babbf0eca126f4d9c77221e087c21c8ee11833e781.webp)

# LUBRICATION SYSTEM

![](images/4fe78db9c1e2ff5cd393c55fadc66f009821a044175478e36d387a32aedc91b9.webp)

![](images/2b1fb1fec228b08afb04daee60e4ad83cb9b176f73a91d82a6a2b95e6c89959c.webp)

![](images/a31e1048c64690eba7845f40c42c50c6a293eb1d0d03a5997de960fc3143022a.webp)

![](images/911e2f682afa9dc5b651070bb820d6cf31fad465bd8fd05b153be0e37db8f7cd.webp)

# COOLANT FLOW CHART

![](images/50bd02f4cc264a27ca2d29b41a8981461648e9eaae13667e1d952aa50d716d88.webp)

Y220_0A014

![](images/26eda7ac36c8ea5085dd166197348e9439833973d68c79d1ab5eb5769c5b25ee.webp)

# FUEL SYSTEM

![](images/320f74516d08031dc777f9a8a93809967b893fdcb63c08796581a95a5c4c2a73.webp)

![](images/486448b3c3cf3d57f25dfeea6cce31992e1a6a022c176281271d057272bc6a72.webp)

# FUEL SUPPLY SYSTEM

![](images/ecd25201e8cda005101d5a88ac95a0d08498b5b0b3cbfc39272b5f966efd6e0a.webp)

Components:

- High pressure fuel pump - Fuel rails - Fuel pressure sensor - Fuel injectors - Electroc control unit (ECU) - Various sensors and actuators

Y220_0A016

According to input signals from various sensors, engine ECU calculates driver's demand (position of the accelerato jedal) and then controls overal operating performance of engine and vehicle on that time.

ECU receives signals from sensors via dataline and then performs effective engine air-fuel ratio controls based on those signals. Engine speed is measured by crankshaft speed (position) sensor and camshaftspeed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal thatis generated by variable resistance changes in accelerator pedal sensor. Air flow (hot flm) sensor detect intake air volume and sends the signals to ECU. Especially the engine ECU controls the air-fuel ratio by recognizing instant air volume changes from air flow sensor to decrease the emissions (EGR valve control. Furthermore, ECU uses signals from coolant temperature sensor and ai temperature sensor, booster pressure sensor and barometric sensor as compensation signal to respond to injection starting, pilot injection set values, various operations and variables.

![](images/00b2b2d59bcfa26eec1ab152b668a44ca8e214b241678bd9fa65ae75d0b70449.webp)

# GENERAL SPECIFICATIONS

Vehicle Dimension

![](images/822574b4efff72fc7c9f3d76d5970958c4bdce8c8c0e302f497ab818dbb94a32.webp)

Y220_0A017

![](images/2ca9df73d0794aa4ec9f0a581d8a4656ca652865294a6b0c0d549b835a4be4ad.webp)

# Specifications

![](images/8ade26ce9edaa9df8cfec770ed319d7844925ea8cfee45b8b907b7c069098393.webp)

![](images/e910b43b685414ac181d05d593b01373409820a63ee8388e918e45de3f3da14f.webp)

# Specifications (Cont'd)

![](images/b1fe50a94c230b2943ba70774bc0c443aeffcd94f7791d12d8f2c1fb6c660b60.webp)

![](images/4f707c0b1236c729f57aba26fb97a6fe750f7fce37bc1bc18c78f003400eb208.webp)

# Major Components and Service Interval

\* Use only Ssangyong Genuine Parts.   
![](images/db99772592a9d924e0fe319fe982604960131ba4d630cb464a8e5eaa12c525f0.webp)

![](images/f299805caa108bff2fbe7c08bac4a814bcb77e6b4489c27ba355ba94d623e332.webp)

# Lubrication Chart

![](images/f65c9d49f614fc9be9befe3f76363cc159105f5ad0e5d2d4eeca483a42ec37fb.webp)
\*Please contact Ssangyong Dealer for approved alternative fluid. \* In only case not available MB 229.1 or 229.3, APl or ACEA oil may be accepted, however it would rather recommend to shorten the change interval around 30%.

IDI: Indirect Injection DI: Direct Injection

![](images/281c0e420fa46bb1e89bf08270df904ce2a8f656df965ca30de95d211558c21a.webp)

# 1. Vehicle identification Number

Vehicle identification number (VIN) is is on the right front axle upper frame.

# [KPTPOA19S1P 122357]

K.. Nation (K: Korea)   
P .. Maker Identification (P: Ssangyong Motor Company)   
т.. Vehicle Type (T: Passenger car - 4WD)   
P.. Line Models (P: Rexton)   
0 . Body Type (O: 5-door)   
A.. Trim Level (A: Standard, B: Deluxe, C: Super deluxe)   
1 .. Restraint System (0: No seatbelts, 1: 3-point seatbelts, 2: 2-point seatbelt)   
9 .. Engine Type (9: 3199cc, In-line 6 cylinders, Gasoline E32) (D: 2874cc, IIline 5 cylinders, Diesel)   
S.. Check Digit (S: All area except North America)   
1 .. Model Year (1: 2001, 2:2002, 3: 2003)   
P.. Plant Code (P: Pyungtaek plant)   
122357 (Production serial number)

![](images/0deeb74cc4e526964dbbf08cf7357b188132aace31548d9ac0635cff53f56242.webp)

# . Certification Label

The certification label is affixed on the bottom of driver's side B-pillar.

![](images/49ba8b3d1830777391d0d181793715ecb312e34c7bda0182ff764d6188c82713.webp)

![](images/d9f313c7fb905206d307cb800214005ab1d38052a88df7894a9281b4cdd0e5e8.webp)

# 3. Engine Serial Number

The engine serial number is stamped on the lower area of cylinder block in exhaust manifold side.

![](images/3f8efd5bac184c4af0ab1520f1664a033c8b00a92faa2e2110708110c6a79bbe.webp)

# 4. Manual Transmission Number

The transmission label is affixed on the upper area of clutch housing.

# 5. Automatic Transmission Number

The transmisson label is affixed on the right area of transmission housing.

![](images/f02d9136d994b6312acda689405ccbe7a38585eb7fb09dfa7807a32187d49397.webp)

# 6. Transfer Case Number

The transfer case label is affixed on the transfer case housing.

![](images/03c0cecf24b2b30be00e2ead4ae6dc17642ae479787493a2589c5c19dc075793.webp)

Y220_0A022

![](images/bd9c96bd3cccf5fde4ec3798476015bc843cd48766dae7e72d6671b716f324ed.webp)

# HOW TO USE AND MAINTAIN WORKSHOP MANUAL

1. Group: The manual is divided in large group like engine, transmission, axle and others and this group is also divided in small group by vehicle state. Small group: Each small group consists of general, vehicle service, unit repair and special tool usage.

# MANUAL DESCRIPTION

•The contents of the manual consist of operational principle of system, specifications, diagnosis, removal/ installation on vehicle, inspections, disassembly/ assembly of removed assembly, special tool usage. Not providing simple removal/installation information but focused on to describe much more functions, roles and principles of system. •Every automotive term like part name on the manual is the same in parts catalog, technical bulletin and drawings to avoid confusion among them.

# Consists of Smal Group

1. Contents: In small group, included subjects and detailed subjects are described in.

General: In the general, summary of the small group (assembly), function and operational principle, specifications, structure and components, diagnosis and circuit diagram are described in.

3. Vehicle service: Service works on the vehicle like replacement of parts and inspection repairs are described in the order of repair works with actual photos and illustrations. Also cautions in service works, references and inspection methods after completion of service are described in.

4. Disassembly and assembly of unit assembly: Detailed service works like disassembly, inspection, adjustment and assembly on removed component (assembly) are described in with systematic contents and photo illustration.

![](images/7973b1a42c37df7476dae19c90beab9d102f9f1e341744f7ed38e1743d7e54ad.webp)

![](images/c59a70997a951248bf376be0645168059eee669792dabda541758b8a21982aa3.webp)

# GUIDELINES FOR SERVICE WORK SAFETY

General

![](images/053a8f613ebd65f57a63630038ea3584cb1e5d86a89934df247398d48f50db5b.webp)

To maintain and operate the vehicle under optimum state by performing safe service works, the service works should be done by following correct methods and procedures.

Accordingly, the purpose of this manual is to prevent differences that can be caused by personal working method, skill, ways and service procedures and to allow prompt/ correct service works.

# Note, Notice

While using this manual, there are a lot of Note or Notice having below meaning.

# Note means detailed description of supplementary information on work procedure or skill.

Notice means precautions on tool/device or part damages or personal injuries that can occur during service works.

However, above references and cautions cannot be inclusive measures, so should have habits of taking concerns and cautions based on common senses.

# Cautions on Inspection/Service

During service works, be sure to observe below general items for your safety.

•For service works, be sure to disconnect battery   
negative (-) terminal if not starting and inspection.   
•While inspecting vehicle and replacing various consumable parts, be sure to take caution not to damage vehicle and injure people.   
•Engine and transmission may be hot enough to   
burn you. So inspect related locations when they cooled down enough.   
If engine is running, keep your clothing, tools, hair and hands away from moving parts.   
• Even when the ignition key is turned off and positioned to LOCK, electrical fan can be operated while working on near around electrical fan or radiator grille if air conditioner or coolant temperature rises.   
•Every oil can cause skin trouble. Immediately wash out with soap if contacted.   
•Painted surface of the body can be damaged if spilled over with oil or anti-freeze.   
Never go under vehicle if supported only with jack.   
•Never near the battery and fuel related system to flames that can cause fire like cigarette.   
•Never disconnect or connect battery terminal or other electrical equipment if ignition key is turned on.   
While connecting the battery terminals, be cautious of polarities (+, –) not to be confused.   
•There are high voltage and currency on the battery and vehicle wires. So there can be fire if shortcircuited.   
• Do not park while running the engine in an enclosed area like garage. There can be toxication with CO, so make sufficient ventilation.   
•The electrical fan works electrically. So the fan can be operated unexpectedly during working causing injuries if the ignition key is not in LOCK position. Be sure to check whether ignition key is in LOCK position before work.   
•Be careful not to touch hot components like catalytic converter, muffler and exhaust pipe when the engine is running or just stopped. They may burn you badly.

![](images/4f4f67754afb01855e5531dad8680d96d5f39164f3fb082b499388045b92c0c5.webp)

# Guidelines on Engine Service

To prevent personal injuries and vehicle damages that can be caused by mistakes during engine and unit inspection/ repair and to secure optimum engine performance and safety after service works, basic cautions and service work guidelines that can be easily forgotten during engine service works are described in.

# Cautions before service works

•Before work on engine and each electrical equipment, be sure to disconnect battery negative (-) terminal.   
Before service works, be sure to prepare the works by cleaning and aligning work areas.   
•Always position the ignition switch to OFF if not required. If not, there can be electrical equipment damages or personal injuries due to short-circuit or ground by mistake.   
•There should be no leak from fuel injection system (HP pump, fuel hose, high pressure pipe) of the D27DT engine. So they should be protected from foreign materials.   
•While removing the engine, do not position the jack and others under the oil pan or engine. To secure the safety, use only safety hook on the engine.

# Engine and accessories

Engine has a lot of precise portions so tightening torque should be correct during disassembly/assembly and removal/installation and service work should be done in clean ways during disassembly/assembly.

Maintaining working area clean and cautious service administration is essential element of service works while working on the engine and each section of the vehicle. So the mechanics should well aware of it.

• While removing the engine, related parts (bolts, gaskets, etc.) should be aligned as a group. •While disassembling/assembling internal components of the engine, well aware of disassembly/assembly section in this manual and clean each component with engine oil and then coat with oil before installation. • While removing engine, drain engine oil, coolant and fuel in fuel system to prevent leakage. •During service work of removal/installation, be sure to check each connected portions to engine not to make interference.

# Fuel and lubrication system

Painted surface of the body can be damaged or rubber products (hoes) can be corroded if engine oil and fuel are spilled over. If spilled over engine, foreign materials in air can be accumulated on the engine damaging fuel system.

If work on the fluid system such as fuel and oil, working area should be well ventilated and mechanic should not smoke.   
•Gasket or seal on the fuel/lubrication system should be replaced with new and bolts and nuts should be tightened as specified.   
• After removal/installation works, be sure to check whether there is leak on the connecting section.

If fine dust or foreign material enters into DI engine's fuel system, there can be serious damages between HP pump and injectors. So, be sure to cover removed fuel system components with cap and protect removed parts not to be contaminated with dirt. (Refer to cleanness in this manual while working on Dl engine fuel system)

# Electrical equipment

Electrical equipment should be handled more carefully. Currently, the engine is equipped with a lot of electrical equipments so there can be engine performance drops, incomplete combustion and other abnormals due to short and poor contact. Mechanics should well aware of vehicle's electrical equipment.

•If have to work on the electrical equipment, be sure to disconnect battery negative (-) terminal and position the ignition switch to offif not required. •When replacing electrical equipment, use the same genuine part and be sure to check whether ground or connecting portions are correctly connected during instalation. If ground or connecting portion is loosened, there can be vehicle fire or personal injury.

![](images/c0c93d6236dc928c584ff3c6c28f540cc4d29078e7ac9a0244ee309ed117bb08.webp)

# During Service Work - Inspection

Before lifting up the vehicle with lift, correctly support the lifting points and lift up. When using a jack, park the vehicle on the level ground and block front and rear wheels. Position the jack under the frame and lift up the vehicle and then support with chassis stand before service work.

![](images/9c74d1fa458f3ebf3177a76d7ec9dd95da1bfbc181ab210e75e4cd5e82447740.webp)

3. Before service work, be sure to disconnect battery negative (-) terminal to prevent damages by bad wire and short.

4. If service from interior of the vehicle, use protection cover to prevent damage and contamination of seat and floor. 5. Brake fluid and anti-freeze can damage painted surface of body. So carefully handle them during service work.

![](images/dc29644171ca11ce976e95e2d1ee3f48ad54033ad3234196f032d66a2d1f0d97.webp)

6. Use recommended and specified tools to increase efficiency of service work.   
7. Use only genuine spare parts.

![](images/771365c9c70034797ae661e2487d9928a46b4ed6a50ec2037af6e4e41049b937.webp)

Y220_0A028

![](images/3a2b9bedd1d4597d27cabbed0975c0fc6f6ddbeb218d7d2a47a02512848c7ed2.webp)

![](images/c8a5cc4ee88f4fc384dba721bf7d7744d6c0432c5398eb323d595addbdc384ae.webp)

8. Never reuse cotter pin, gasket, O-ring, oil seal, lock washer and self-locking nut. Replace them with new. If reused, normal functions cannot be maintained.   
9. Align the disassembled parts in clean according to disassembling order and group for easy assembling.   
10. According to installing positions, the bolts and nuts have different hardness and design. So be careful not to mix removed bolts and nuts each other and align them according installing positions.   
11. To inspect and assemble, clean the parts.   
12. Securely clean the parts that related with oil not to be affected by viscosity of oil.   
13. Coat oil or grease on the driving and sliding surfaces before installing parts.   
14. Use sealer or gasket to prevent leakage if necessary.   
15. Damaged or not, never reuse removed gasket. Replace with new and cautious on installing directions.   
16.Tighten every bolt and nut with specified torque.   
17. When service work is completed, check finally whether the work is performed properly or the problem is solved.   
18If work on the fuel line between priming pump and injector (including return line), be sure to cover the removed parts with cap and be careful not to expose the connecting passage and removed parts to external foreign materials or dust. (Refer to cleanness.)   
19 If remove high pressure fuel supply pipe between HP pump and fuel rail and high pressure fuel pipe between fuel rail and each injector, be sure to replace them with new.

![](images/5ebe55e083df91cf02ee7f33ead2e248aded3a68d32e11c0b7b9f836808d6db6.webp)

# During Service Work for Electric Devices

Be careful not to modify or alter electrical system and electrical device. Or there can be vehicle fire or serious damage.

Be sure to disconnect battery negative (-) terminal during every service work. Before disconnecting battery negative (-) terminal, turn off ignition key.   
Replace with specified capacity of fuse if there is bad, blown or short circuited fuse. If use electrical wire or steel wire other than fuse, there can be damages on the various electrical systems. If replaced with over-capacity fuse, there can be damages on the related electrical device and fire.   
3. Every wire on the vehicle should be fastened securely not to be loosened with fixing clip.   
4. If wires go through edges, protect them with tape or other materials not to be damaged.

![](images/e9615aa52b5b40f14c5266bd410740c47bc41614bd1cd9afe483dd5a0b4bc253.webp)

5. Carefully install the wires not to be damaged during installation/removal of parts due to interference. 6Be careful not to throw or drop each sensor or relay. 7. Securely connect each connector until hear a “click" sound.

![](images/5144d65ef27101b2be7550fdae711e21a4d273b537900d1756b12937db2f5c96.webp)

![](images/f5208858258733f5d33e18e061ebc29e234931fd33b033daed27e989c3f7f67c.webp)

# Lifting Positions

Asilustrated, position the vehicle on the 4-post ift securely and block the front and rear of each tire not to move during working.

# Notice

During lifting, be sure to check whether vehicle is empty.

Board-on lift connection device installed in front of vehicle should be positioned in front of sillocating under the front door.   
Installift connecting device on the edge of front and rear of board-on lift.

# Warning

Be sure to use attachment during lifting to prevent the lift from contacting with body floor. While lifting the vehicle, widen thelif floor as far as possible to stabilize between vehicle front and rear. When fixing the lif floor, be careful not to contact with brake tube and fuel lines.

# 2. Safety jack and safety stand

If lift up the vehicle with safety jack and stand, should be more careful during works.

# Warning

•Never be under the vehicle if supported with only jack. If have to be under the vehicle, be sure to use safety block. •Use wheel block in front and rear of every wheel.

![](images/2b91e4505b5df3160281eb320c1437c92fe9063abc22a3665474f55a8a59cb28.webp)

![](images/9024c31f11373caf53d71d64d641a26040cdaba8bb994b10aacb57caf7b76553.webp)

# Tightening Torque By Bolt Specification

![](images/50926165c1562ed5da45e84adefb6872eaabf61ec0e23f03aab95a18005a73c2.webp)

![](images/46d94782d13e2291826cde4c0e47edf476f5a9caf6530e3db2136d4faa300931.webp)

Y220_0A034

1.Metric bolt strength is embossed on the head of each bolt. The strength of bolt can be classified as 4T, 7T, 8.8T, 10.9Т, 11T and 12.9T in general.

2. Observe standard tightening torque during bolt tightening works and can adjust torque to be proper within 15 % if necessary. Try not to over max. allowable tightening torque if not required to do so.

3. Determine extra proper tightening torque if tightens with washer or packing.

4. If tightens bolts on the below materials, be sure to determine the proper torque.

Aluminum alloy: Tighten to 80 % of above torque table. •Plastics: Tighten to 20 % of above torque table.

![](images/1fe01eec38bf3745993e48509bd8c8f866f96b157311c02c1e0d1ba9cc7c9791.webp)

![](images/8fbedc1d28eb0b7e2fa9490ee86663b8ef3fd18b2a76ade523c0646460b6ed7c.webp)

# STRUCTURE AND FUNCTION DESCRIPTIONS ... DI01-3

D27DT engine DI01-3   
Engine performance curve. DI01-8   
General diagnosis.. DI01-10

# DIAGNOSTIC INFORMATION AND PROCEDURE .. DI01-15

Oil leak diagnosis. DI01-15   
Compression pressure test DI01-16   
Cylinder pressure leakage test DI01-18   
Tightening torque. DI01-19

# REMOVAL AND INSTALLATION. . . DI101-222

Engine mounting . DI01-22

# DISASSEMBLY AND REASSEM.BLY  M01-32

Components and special tools . DI01-32

![](images/bac45d9211b50a2a2342651947ecc16a4839332e4a999df8c2b93a52978f08a9.webp)

# Major Components in Engine and Engine Compartment

The advanced electronically controlled D27DT engine that has high pressure fuel system has been introduced to this vehicle. It satisfies the strict emission regulation and provides improved output and maximum torque.

![](images/3f8087cb0aea0d7569d20701d0dd4e3048cd889e75a7e376272aa3c24ad587dd.webp)

Y220_01001

1. Coolant reservoir 6. Fuse box 11. EGR valve   
2. FFH device 7. Battery 12. Air cleaner assembly   
3. Brake fluid reservoir Fuel filter 13. Turbo charger   
4. Washer fluid reservoir 9. Power steering pump 14. Oil dipstick   
5. Common rail 10. Priming pump

![](images/1edd80dfd9a4760f0b73532d6aaca2280309d390d17ca992313d53bd7573ae15.webp)

# Engine Structure

![](images/4894ec5caa3c5becd9ae8520211d261c133fe33d0a91fde71f34546df2a24518.webp)

Y220_01002

1. TVD (Torsional Vibration Damper)   
2. Air conditioner compressor   
3. Power steering pump pulley   
4. Idle pulley   
5. Coolant pump pulley   
6. Alternator   
7. Viscos fan clutch   
8. Auto tensioner pulley   
9. Auto tensioner   
10. Poly-grooved belt   
11. Cam position sensor   
12. Drive plate (MT: DMF)   
13. Oil filter   
14. Vacuum pump   
15. Crank position sensor   
16. EGR valve   
17. Power steering pump   
18. EGR to center pipe   
19. Cylinder head cover   
20. Intake manifold   
21. Water outlet port   
22. Common rail   
23. Fuel pressure sensor   
24. Fuel pipe   
25. Injector   
26. Fuel return line   
27. Oil filler cap   
28. Glow plug   
29. Booster pressure sensor   
30. PCV valve and oil separator   
31. Oil dipstick   
32. EGR-LH pipe

![](images/2079acddc46adfbc8755906421377ad58fbe2fff7244f3954d63e1eb4225adca.webp)

![](images/7a534f62ddda8c5b3fb163ef308e1a83dbdf73c632d4f10172913b93724c1a94.webp)

![](images/795fb2564fab3e7034dc18ee6efcc1ac7623335ac16153f989380040ac947f2c.webp)

![](images/496e868ee39c31879f2b0c27abd1746a191fcb87b57efc108f0ce43f56df7fc1.webp)

Y220_01004

33. Cylinder head   
34. Cylinder block   
35. Oil pan   
36. Drain plug   
37. Turbo charger   
38. EGR-RH pipe   
39. PCV valve and oil separator   
40. Oil dipstick   
41. High pressure pump   
42. Turbo charger booster vacuum   
modulator   
43. EGR valve vacuum modulator   
44. EGR valve   
45. Exhaust manifold

![](images/79077323e4d5ae7b804e46024ab23fd7acb6ae17fa035db525de3222e9de030e.webp)

# Specifications

![](images/7eb41ba2e65b42b4ce77ed33d0d54db33b56eac32377ed466c6903ec0a84d771.webp)

![](images/9eb62504151e33fa71d1ac45426a26bcd6b0bfdc9f1e728f5e5c7b1bfd452d39.webp)

# ENGINE PERFORMANCE CURVE

Output and Torque

![](images/2f40723a8d37334724f08d4ddf71e6d7f77c0094738cdaf0b0960961adf6d857.webp)

Y220_00025

![](images/358688a60be5079f4f1b16fe71a6a412936336a7b3201d802741e98af76dd570.webp)

# Oil Temperature/Pressure and Boost Pressure

![](images/4ae221e7f454d08a4c44d7bc384b8518b0b3ca1ac6bbdcc2311de87d28383477.webp)

Y220_00026

![](images/bb3d7e58cc26593e3544f41531ee177013e041c82fa4c7ce8cfaa4c54eff66a8.webp)

# GENERAL DIAGNOSIS

![](images/591f6675e5a7003c656bea107a2841f143d7ead05a64e03ef136bc6308090bf4.webp)

![](images/8ac84400212d9b58e3c164a10dd3a025de150de72dc02f4f3ac9e4475a6309d6.webp)

# GENERAL DIAGNOSIS (Cont'd)

![](images/12eb1be7409ea21f5a25286ff589c59145f619c1ee9f6951b70ffc03b38a9519.webp)

![](images/a754f70fee7e35600a85ccf8b5ba71ae393de171a6423478a8a021eec1a1a2ff.webp)

# GENERAL DIAGNOSIS (Cont'd)

![](images/48c2bd6bdc5f4e36255f1884318ae5930c1dbc0a2e37c860a8e3a18ca83254de.webp)

![](images/b6f38378e0d569d3d437cd8a7f9820453cb19c620dfdb94911e705f3920e6f54.webp)

# GENERAL DIAGNOSIS (Cont'd)

![](images/e4f071d6f83db086421d4b360ab1a659bb56621111c12f051175562892987048.webp)

![](images/f80385c6b31a033ec538cdc1c59760bb16042a65de3128bd16dc936c2d1afdb5.webp)

# GENERAL DIAGNOSIS (Cont'd)

![](images/2cfcc45e64751f6591f745403a9adc991f5a0fce3a0e8f698666083e74a358ac.webp)

![](images/8b2a05e35af0c390759659e679f5cc83e06ab8d87edd539e2996d8282c8dc522.webp)

# DIAGNOSTIC INFORMATION AND PROCEDURE

Most fluid oil leaks are easily located and repaired by visually finding the leak and replacing or repairing the necessary parts. On some occasions a fluid leak may be difficult to locate or repair. The following procedures may help you in locating and repairing most leaks.

# Finding the Leak

Identify the fluid. Determine whether it is engine oil, automatic transmission fluid, power steering fluid, etc.

Identify where the fluid is leaking from.

2.1 After running the vehicle at normal operating temperature, park the vehicle over a large sheet of paper.   
2.2 Wait a few minutes.   
2.3 You should be able to find the approximate location of the leak by the drippings on the paper.

3. Visually check around the suspected component. Check around all the gasket mating surfaces for leaks. A mirror is useful for finding leaks in areas that are hard to reach.

If the leak still cannot be found, it may be necessary to clean the suspected area with a degreaser, steam or spray solvent.

4.1 Clean the area well.   
4.2 Dry the area.   
4.3 Operate the vehicle for several miles at normal operating temperature and varying speeds.   
4.4 After operating the vehicle, visually check the suspected component.   
4.5 If you still cannot locate the leak, try using the powder or black light and dye method.

# Powder Method

1. Clean the suspected area.

Apply an aerosol-type powder (such as foot powder) to the suspected area.   
3. Operate the vehicle under normal operating conditoins.   
4. Visually inspect the suspected component. You should be able to trace the leak path over the white powder surface to the source.

# Black Light and Dye Method

A dye and light kit is available for finding leaks, Refer to the manufacturer's directions when using the kit.

1Pour the specified amount of dye into the engine oil fill tube.   
Operate the vehicle normal operating conditions as directed in the kit.   
.Direct the light toward the suspected area. The dyed fluid will appear as a yellow path leading to the source.

# Repairing the Leak

Once the origin of the leak has been pinpointed and traced back to its source, the cause of the leak must be determined in order for it to be repaired properly. If a gasket is replaced, but the sealing flange is bent, the new gasket will not repair the leak. The bent flange must be repaired also. Before attempting to repair a leak, check for the following conditions and correct them as they may cause a leak.

# Gaskets

•The fluid level/pressure is too high.   
•The crankcase ventilation system is malfunctioning.   
•The fasteners are tightened improperly or the threads are dirty or damaged.   
•The flanges or the sealing surface is warped.   
There are scratches, burrs or other damage to the sealing surface.   
•The gasket is damaged or worn.   
•There is cracking or porosity of the component.   
•An improper seal was used (where applicable).

# Seals

•The fluid level/pressure is too high.   
•The crankcase ventilation system is malfunctioning.   
•The seal bore is damaged (scratched, burred or nicked).   
•The seal is damaged or worn.   
•Improper installation is evident.   
•There are cracks in the components.   
•The shaft surface is scratched, nicked or damaged.   
•A loose or worn bearing is causing excess seal wear.

![](images/282202d6965c6497627f931e677c6eb0bdd3038816535ee76aca523b0c02b02c.webp)

# COMPRESSION PRESSURE TEST

The compression pressure test is to check the conditions of internal components (piston, piston ring, intake an exhaust vale, cylinder head gasket). This test provides current engine operating status.

# Notice

•Before cranking the engine, make sure that the test wiring, tools and persons are keeping away from moving components of engine (e.g., belt and cooling fan).   
•Park the vehicle on the level ground and apply the parking brake.   
•Do not allow anybody to be in front of the vehicle.

![](images/08978efa3bfd415320d9d223487ad0d8b6ea89d43e89239f8c7ab8bd5239eac8.webp)

# Specifications

![](images/f3992f2f137b09b0498599d25f6a0187a5da0df32a596b7d25df2b565333f13b.webp)

![](images/cb694116df634f64a5523c13405c57244d2f3f2da362cc891850fabf72a2e778.webp)

# Measuring Procedure

•Disconnect the fuel rail pressure sensor connector to cut off the fuel injection.   
Discharge the combustion residues in the cylinders before testing the compression pressure.   
•Apply the parking brake before cranking the engine.   
1. Warm the engine up to normal operating temperature (80°C).   
2. Disconnect the fuel rail pressure sensor connector to cut off the fuel injection.   
3.Place the diagram sheet to compression pressure tester.

![](images/bfa142c7728cdc9b3c131a5222de71d820d8f19af3239c027d213a05da66cc96.webp)

4. Remove the glow plugs and install the compression pressure tester into the plug hole.

![](images/1099feaa539b7334e224de633ea9350108fb043a4b98a057fe5061a27d877bee.webp)

![](images/eab652a53e6550afd087ccb97706143acfad1bb90264de48edbffdec20f9de86.webp)

5.Crank the engine for approx. 10 seconds by using the start motor. 6. Record the test result and measure the compression pressure of other cylinders with same manner. 7. If the measured value is not within the specifications, perform the cylinder pressure leakage test.

![](images/8d028ce51c7db884de246356ffd16b9a6373dd54a8867d7e1208a5256a917c65.webp)

![](images/c6cc4c2c168650f1ac31410725a832e9c97ff6804cbe97c30b40bd0fca1fd5ea.webp)

# CYLINDER PRESSURE LEAKAGE TEST

![](images/40e0a74a53931e20939a51be72e8b4af30c3d5fdbe04af6d2f46f9ec62faba4e.webp)

If the measured value of the compression pressure test is not within the specifications, perform the cylinder pressure leakage test.

# Permissible Pressure Leakage

![](images/503e8a132c6ac3c1dcc907b8a3d89886ca6c4c8d73b4f338a6d94e9bb31a931d.webp)

# Notice

Perform the pressure in order: 1- 2- 3- 4 - 5   
Do not test the cylinder pressure leakage with wet type test procedure. (do not inject the engine oil into the combustion chamber)

![](images/c10aaa177d2a962cd42dbe786840cfeafbedb5ed0b41a4338cef710f201447cc.webp)

# TIGHTENING TORQUE

![](images/a52ea73aa034e4e168f99fd1c5c04624aa581d70836fcb98a46a24c0f7285e27.webp)

![](images/0cc6b6c74c8deecda95043ee07d3a0e9278a9bfaed1e553b269b9cc8cb0e0bf6.webp)

![](images/0e87440c61fb50594678a2c7ff73e86ef6fd45e5996f63ccc0f252d952027711.webp)

![](images/bfc8e130ae07285bc0271e52c200c8065e91cf18654f32c65c76827dc09b2c3e.webp)

![](images/ada4a8b816d89e911f0173aba248f1c08ca83d7f3eaed56fa49e3769b241199e.webp)

![](images/25d026f46f1f559d7e696958a1347fe8df3e1337490eead24bc778bcdea7db33.webp)

# REMOVAL AND INSTALLATION

![](images/dcedf1ff6a54c2b2de555cf473c8ae9ce42bfd79c63e04c03976abfb20bef147.webp)

# 1. Side Mountings

![](images/69fbe1ceb125307dbdc4a5c3e1d765e13bb5863d0cfbd661c7c8f694d7ebeff1.webp)

![](images/0f878e1a91eb2102923158ab99087ec463d6697d944c40791de354ea2ea70bd9.webp)

# Transmission Mounting

![](images/5b8fda64d1c1544397c203b8fe87d7ca33c3c814d54e14d6810a9162dd2e1506.webp)

![](images/a664aefe22086469646805bbddf923778ab92b96d963a21575620127c8637390.webp)

3. Exhaust Manifold and Pipe

![](images/e7baa12345fa9d2cf098d62a142b24b478a9830bdf314a60768cc21cf4aad7e8.webp)

# 4. Cables and Connectors

Y220_01010

# Notice

Disconnect the negative battery cable before removal.   
Drain the engine oil.   
Drain the engine coolant.   
Be careful not to splash the fuel to the vehicle body. It may cause a fire or vulcanization of rubber products. Make sure to block the fuel related hoses before removal.

![](images/4973ff3c13c6b4925314fd6505f3473d9aaf7c15535ca51d735d69b6ee01c753.webp)

# Engine Assembly - Removal

Disconnect the negative battery cable.

# Notice

If not necessary, place the ignition switch at “OFF" position.

Remove the engine hood assembly.

![](images/7ba8981822426a8229f0770b3c568c441b740ef7470c614b4e9ce66745e41260.webp)

Note Refer to "Body" section.

3Remove the skid plate under the engine compartment. Installaiton Notice

![](images/c5ff9ed731a2a583c690583bdd7e3cf1ce1dfcc2f7ea34e20edf462561a0a9a9.webp)

![](images/218df5b03372da5b872c770e2a7989caa577543963e5ed4e2f344e9b2d29575f.webp)

4. Loosen the radiator drain cock and drain the coolant.

# Notice

1.Be careful not to contact with coolant. If contacted, wash with soap and water to ensure all coolant is removed.   
Use only designated coolant.   
3. Open the coolant reservoir cap to help the draining.

![](images/05b29092fd15b98091e3ee3f49b4f271fb053d381ddad4c3f55aa5a92a5353d6.webp)

![](images/f2bc871fefefdfee594d55718c41e899d9f96392dfb66460c298293fb2fe170b.webp)

![](images/53b2211666e2b686bc5957995616e80f3cd3d6342381f8ada66ed68731b445f7.webp)

![](images/544fe093d2810f3fcf92a2efcb55d8093b86f74777e5070b36c4a026f9dfd181.webp)

![](images/659c648f70f1ce638d0071df6c38151f1ae2a6a00ba91b4b4167873000fdebc3.webp)

5. Loosen the cylinder block drain plug (under the intake manifold) and drain the coolant completely.

6.Retighten the drain plug with the specified tightening torque.

![](images/68956a859dd7729b6f757b3f7c55e0c51ffb8eb11f79f3596f6db8eb12635286.webp)

7Remove the inlet hose (1) and the heater hose (2) under the radiator.

# Notice

Be careful not to damage the rubber hose.

Remove the coolant outlet hose over the radiator.

# Notice

Be careful not to damage the rubber hose.

Remove the radiator grille and loosen the hose clamp on the outlet port of turbo intercooler.

# Note

For the removal and installation of radiator grille, refer to “Cooling System” section.

10Loosen the hose clamp on intake air hose of turbo charger and remove the intake air hose.

11. Separate the outlet hose of oil separator from the intake air hose of turbo charger.   
12. Loosen the clamp on the intake air duct hose of turbo charger at the air cleaner side and separate the hose from the air cleaner housing.

13. Loosen the clamps and remove the intake air hose from the turbo charger.

![](images/6008a7524930324bd286649529de96960921ea4c3a60cf46c060305713b8b0c8.webp)

14. Loosen the clamp on the inlet hose of intercooler.

![](images/bf71918e814497af9c0759c6f0a2b3622a8b954eda9f6823c97a4010d081058d.webp)

![](images/899055a962dbab4ca21f2ff761626e889f99fd0d0d3e8e2bc618a1a6bcedde9e.webp)

15. Loosen the clamp on the intake manifold and remove the intake air hose.

![](images/ed5a88aba69182e020f511e295f1ddae49c01435d26f7de361be8fb14ba3500e.webp)

16.Remove the exhaust pipe mounting nuts from the turbo charger.

Installation Notice

![](images/7bdd73b9f75a520ce775201b7f7552c685bec5363a8a7971a42fd03e763d0c0e.webp)

![](images/59852841ed9df636efa4389ed9f18b7eca8e7fd86a0820f6dc490127573b3b6f.webp)

17.Remove the power steering inlet pipe and the outlet hose from the power steering pump.

# Plug the openings of hoses and pump with caps not to flow out the oil.

Installation Notice

![](images/1d5eba297949ef9314c52b2d47980d4c3bf235d248b5b347efd70b49a1e07847.webp)

![](images/1c0ad61bc483e1e92bc249d53a6e840af2498ecb15cafe26d634726723d37687.webp)

![](images/a9be6cc60adb63e50420b0881eeb267564e2350fb147ec5b9c356a5d26e2ecd1.webp)

18Remove the vacuum hose from the brake booster. Installation Notice

![](images/8916b5d7272cfab4e31d6926a26390bd97c6892aa903b803fb7d097c02e6a0fc.webp)

19.Remove the supply inlet, supply outlet and return hose from the fuel filter.

# Notice

When separating the hoses from the fuel filter, plug the openings with caps so that the contaminants will not get into the fuel system. Mark on all the hoses not to be mixed each other.

20Remove the engine oil heater outlet hose.

21. Disconnect the cables from the cylinder block and other components. (e.g., coolant temperature sensor cable and oil temperature switch)

![](images/817971eb2f331d3eedfa4f421454e31d6e30c8e26dae0d0b4e377351a7ac6eda.webp)

22. Disconnect the engine ground cable and the alternator “+” terminal cable.

# Notice

Make sure to properly tighten the cable nuts when installing. Otherwise, it may cause a poor ground or electric charging problem.

23. Disconnect the “ST” terminal and “+” terminal cables from the starter motor.

# Notice

Make sure to properly tighten the cable nuts when installing. Otherwise, it may cause an engine starting problem.

![](images/db5bed06e92bd7c55d39ffa3eb41abeb9e6aae9a5b1c667832ccde04952ead6e.webp)

![](images/14dcf2025c69bc77c7445f69addb723d6cd6e625cc92c35a75e84869af60203c.webp)

24. Disconnect the air conditioner compressor connector and remove the inlet and outlet pipes from the compressor.

![](images/7facfe98e30447c280099dd0cf8e5867cb76b6a720ee376279ac12b677dced11.webp)

25.For the automatic transmission equipped vehicle, remove the oil cooler pipes.

![](images/bb6e469d442c2f1b72133b4bddb1525c4774c6cea368e55da900045dbf24c265.webp)

# The oil cooler pipes are connected to cylinder block at both sides and bottom area of oil with brackets.

![](images/1419aaad25eb99cb71887a178cb9f517f5373b315ec6eab29299ffdc42a5b535.webp)

![](images/ba48609a997de11a63960f5cdd900bdd81c234f2d4c1a8cc4c07e3e23b292b99.webp)

![](images/7ac337e6a5e57feceaa15ab50fc17f959624c95a894dc4b66cff57270707a51e.webp)

26Set up the special to the cooling fan pulley and remove the cooling fan assembly. To make the removal easier, loosen the radiator shroud.

# Installation Notice

![](images/5676e53fbb141da61d774d199556c3c30f6b70db31fa8dee16981f0edcf2b47c.webp)

27. Remove the radiator shroud.

# Installation Notice

![](images/89782af2fa7fa0cfeec80376f44460e9269fd78a6e0ce0a89b6dee857ea592c4.webp)

Take of the fan belt from the engine.

1. Insert a tool into the belt tensioner and rotate it counterclockwise to take off the fan belt.   
After installation of the fan belt, pump the belt tensioner 3 to 4 times.

# Note

![](images/dff901fd02f223eaafa8a2672cae06845f6252459781f00a4b85c23e1fd652a6.webp)

![](images/4a35625d01aaf6050eab8ef5fdc0b69d1e9a8ea96e0bdbfa607854720c3e2cc2.webp)

2.Remove the transmission mounting bolts and separate the engine assembly from the transmission assembly.

![](images/08d6c8117bec1205551717eb170724d40517ad2326e71e4e91c964e3e0ff3cf0.webp)

Y220_01041

# Before unscrewing the transmission mounting bolts, remove the starter motor.

Installation Notice

![](images/6ba57655ea6d8a3452380bbbd30eeac1a3acc1dbeee2659726587b911ffe4188.webp)

![](images/3e7bdc87a555440c09f9022244057ae92e4b7306b223871fd6e7811dc8119165.webp)

30. Remove the engine assembly mounting nuts at both sides. Installation Notice

![](images/7c5e0e2fc686b7c800c8652a5303a30cd5544b2f6fe4b47e2557cfdf0332342f.webp)

![](images/b1690c6eb3fb13987e128be6febdd6c25bec44d98a3224d20b0688f4ab03fd67.webp)

32.Put the removed engine assembly on the safety stand.

31. Hook the chain on the engine brackets and carefully pull out the engine assembly from the vehicle by using a hoist or crane.

![](images/a696a694ff8e285b851c277dd767ccd0c69eca665e13643b129b6fb50b4f6468.webp)

Y220_01043

![](images/b4d547298b7777a01478bd2034f6a5f2975d8d584de5da4a189751d4a23d5586.webp)

# COMPONENTS AND SPECIAL TOOLS

![](images/90a91f4258969d835195cdcb5902bc74ee3607b361fe6e2b394e3faf538820aa.webp)

![](images/aba270335e72d65acc5d49d7dbfab1c5060ff2c296cd3b97c5646af9972642c4.webp)

# Inspection Before Disassembly and Reassembly

1. Remove the cylinder block drain plug and seal and completely drain the residual coolant from the cylinder block.

![](images/b1f0141a0dfd9041164d024e14146fb807b9aaddf2e57a2d886e5645282cce4f.webp)

# Notice

Replace the seal with new one once removed.

When the fan belt is installed, gently pump the belt shock absorber mounting bolt (M19) 3 times.

Take offthe fan belt while pushing the mounting bolt (M19).

4Loosen the oil drain plug and completely drain the engine oil.

![](images/342c2a8ea58a132f7d92ede31b2611a179f2fcc8c349a581e4779ebe5513ba5c.webp)

![](images/3c26e18b5520ba0d8fa4b2925d262caeac8d14cc4ec554f47edbc1de0c72a50f.webp)

![](images/b78ba17a67230bcf330095bef9a6c0a05804bb3b6d5d203a63f87f5647b6aa6c.webp)

![](images/9aa7058943ea8d0e2959d9bbdad0055ab6dc5862baab3eb003cd4e5ebfd05017.webp)

# Accessories - Removal and Installation

![](images/4b5758a77c29babfcbbad2041df8642621c9925a3a8c7b36f2cf924f1d9b0030.webp)

![](images/59b1072528b22ede89726abb1ea51ac5d04ca1918b06596cab0518304792dc57.webp)

The engine accessories can be removed without any specific order. In general, remove the components from top to bottom. However, be careful not to splash the lubricants to engine and body when disassembly. Especially, avoid getting into other components.

# Removal and Installation Order of Major Accessories

1. Vacuum Modulator

0

. Engine Cables and Connectors

0

3. Fuel Hoses

0

3-1. EGR Valve Assembly

↑

4. Oil Filter Assembly

↑

4-1. Belt Tensioning Assembly

0

5. Power Steering Pump Assembly

0

6. Air Conditioner Compressor Assembly

0

7. PCV Valve Assembly

\* Camshaft Position Sensor   
\* Crankshaft Position Sensor   
\* Injector Fuel Line Connector   
\* Glow Plug Connector   
\* Fuel Return Hose   
\* High/Low Pressure Hoses in HP Pump   
\* Ground Cables   
\* Fuel Pressure Sensor Connector   
\* Booster Pressure Sensor Connector   
\* Knock Sensor Connector   
\* Coolant Temperature Sensor Connector   
\* HP Pump: Fuel Temperature Sensor (Green) IMV (Brown)

V

Oil Dipstick Tube

Turbo Charger > Alternator Assembly

![](images/862107358fed8b99beaa84f20ebba866762f6b112110e4edd9ff672d5becd93b.webp)

![](images/11dc0f6eaba48ae70d981e83da5e16fa576c58786c61ed0f09537b5bd0e316f9.webp)

![](images/22298dcdbaab2fbba0091b06c9b3d56800fb8cc9f22012095f504bd307416cab.webp)

Y220_01051

# Installation Notice

![](images/32acbccfc2068ecbee5662c30a84ae41badaf5ecf1d78994d5088c6f5000e2c5.webp)

Remove the fuel pipes.

A.Remove the fuel supply pipes between each cylinder and common rail with a special tool.

![](images/5ab3c18f2240349bb1595c451555ead71cb9bf17aaf926f0677aec090a368c40.webp)

# Notice

1. Plug the openings of injector nozzle and common rail with sealing caps after removed the fuel pipes.

Replace the pipes with new ones. Be careful not to be mixed the fuel pipes because the pipe appearance of #1 and #3 cylinders and #2 and #4 are same each other.

![](images/e5a3a51abb3d8d40febd178f63238f40e9aa0423726515e292837b4931c8fef6.webp)

B.Remove the high fuel pressure pipe mounting bolts with a special tool.

- High fuel pressure supply pipe at common rail side

# Installation Notice

![](images/88c554e9fd66ab9b1b1a7aec00f769114fc0f928f4ec9896c3f3f4a1d94037a4.webp)

C. High fuel pressure supply pipe at HP pump side Installation Notice

![](images/e76be4c00fe78483acb112e57d083ababd0c4cb4876cdf7e34e6775a84cbfdde.webp)

![](images/71f43b255a6f1b8b9a1b9d48eb8a29fc471448ce250d291904d950db4ebc11e7.webp)

D. Unscrew the bracket mounting bolts and remove the high fuel pressure supply pipes.

# Note

Special tool: Fuel pipe remover and installer

![](images/ee1ef16d3923e19ad1b723a0a785b5f8b7cd214077a2d55635a66c1c36964a1a.webp)

![](images/41653716bc16adaf51cbc06dadde40f92ad6271a159ce3b8c3bec176b09cb010.webp)

![](images/c98f96aea8dbf53bf9ca1dd3ed7c36058227216292477464fff465c182d5bb85.webp)

.Disconnect the vacuum hoses and module cables from the vacuum modulator.

# Notice

Put the installation marks on the modulator hoses and connectors.

![](images/2c4e1a933753ebbddcb725ad20d670356a018a3a0d1188dd8aefe87f0f96ef1d.webp)

Y220_01056

![](images/61c98e58b1344c0f3720b009dc7f834b58b957b565e2d0c12103dee886e62dfc.webp)

A.Remove the vacuum modulator bracket. (Upper: 10 M x 2, Lower: 10M x 2) Installation Notice

![](images/b1940194a206fd6ee176becb53c885cb44663ffea9e30de30e48b8cd1900841c.webp)

![](images/37c3569bd3981047fa90c6411ac9886e7d0ab242ece1bc13475e4b4e1128438c.webp)

3.Disconnect the wiring harnesses and connectors from the engine.

![](images/11d0a16711225f4a691f8deba02065e4f8f3f7778e939d19f9af13561cdd427d.webp)

![](images/5a7ee5430776eabccafd4b7321c989e1f51fe5eea0fb91a978ca8700a34f739b.webp)

![](images/e90bfe39c27c8fa7d88835e8b7a573bd7578c6f5fcd8e40f0a78a30936dbb560.webp)

![](images/9ff61dcc4433a4b0a19532aaa9a01e767e9d0c25b25857b146726ef42f1b5e2a.webp)

ARemove the cable assembly from the engine.

# Important

If possible, remove the cables after removing the fuel pipes. It make the operation easier and protect the cables and connectors.

Remove the cable screws and ground cable, and then remove the engine cable assembly.

# Notice

•Be careful not to damage the HP pump connecting pipe (venturi) while removing the fuel hose from the HP pump.

4.Disconnect the high and low fuel pressure hoses from the HP pump.

# Notice

•Be careful not to damage the hose connections. •Plug the openings in HP pump immediately after disconnecting the hoses.

Remove the EGR valve and EGR valve pipe.

A.Disconnect the vacuum hose from the EGR valve.   
B. Unscrew the EGR valve bolts and EGR #1 pipe connecting bolts and remove the EGR valve and steel gasket.

# Installation Notice

![](images/2af61283640c8cfa4022c1687fd8f9d3713251d4660da918cc2a8a2ed8595aaf.webp)

C.Remove the EGR valve #1 pipe.

# Installation Notice

![](images/a3b88fcca9da826a31e04712c0863dd390965779d49f6d86542d772504194833.webp)

# The EGR #2 pipe should be replaced with new one.

D.Unscrew the EGR valve #3 pipe (2) mounting bolts and remove the pipe from the exhaust manifold.

# Installation Notice

![](images/331bdd468fd9b2d263874b9855a65a8853dd895e99e1dc7abf2a280c3edcafd4.webp)

# Notice

1The EGR #3 pipe should be replaced with new one.   
2 Make sure that the convex surface of new steel gasket is facing to the bolts.

Remove the oil flter assembly.

A.Remove the oil cooler hose.

![](images/cd6aaea99764036e1f5c2abcaf66093d1be0f9b6649d2667670756633a2d6c5f.webp)

![](images/d51096d3660473755cd6b4f1f162aaa16c6ccad44067519ca5ed252db819aa21.webp)

Y220_01063

![](images/6e783137bcac80d254cf4225cfdda76907bcc8bf2209dfedb45fba12d488ceb0.webp)

![](images/6226e89bc844cf3841369a3455f197e8976a047f4a9d5587a17d1a4a22187f97.webp)

![](images/dcf1295d2839cb2c660de864ac71f5ffcb8a87ba669a8ca20b870b0e8c4c9773.webp)

![](images/84d5065c5fa75d1ab8c2456b39671d224a485ebcdf8d688e0840b9392b2fda3b.webp)

B. Remove the oil fiter assembly mounting bolts.

# Notice

Be careful not to flow out the residual oil from the engine. If flown out, immediately wipe it out.

C. Remove the oil filter assembly from the cylinder block.

# Installation Notice

-Replace the oil filter gasket with new one.

![](images/1ddbb711268e2e8b1ef586beb2120b61227b7e6d1ca11d11c04da25b7625a56d.webp)

7Remove the belt tensioning device.

A. Remove the shock absorber lower mounting bolt. Installation Notice

![](images/67150212a1439a9667c5b1eed8ea13413e64259b9247b00f42bb8583ae96e944.webp)

B. Remove the shock absorber upper mounting bolt. Installation Notice

![](images/0844a310cdeedaa38c9915c48a674b88c9814e6e2b2af3560e8775fb0d5a1876.webp)

C. Remove the belt tensioning device.

# Notice

•To prevent the oil leaks, store the removed shock absorber assembly with standing up. •For air bleeding, pump the shock absorber around 3 times after installation. • Be careful not to damage the rubber parts of the shock absorber when removing. •To prevent the oil leaks, remove the bolts from bottom to top section. On the contrary, when installing, tighten the bolts from top to bottom section.

7. Remove the power steering pump assembly.

A. Remove the power steering pump mounting bolts. Installation Notice

![](images/4c690cd3c496be82a2e7603339533f91c4bcf191fa799165260a063d58d9e781.webp)

# Notice

Be careful not to flow out the oil.

B. Remove the power steering pump assembly from the engine.

# Notice

To prevent the oil leaks, store the removed power steering pump assembly with standing up.

Remove the air conditioner compressor assembly.

A. Unscrew the bolts and remove the air conditioner compressor assembly.

# Installation Notice

![](images/dce3be77214e61b2957ed1274bbc90b96cdde7c346e4aad34b359d0f8d7a8437.webp)

![](images/44d35c59bb8844479dce0815b7ce26f16fc8d2c57899884d6b026e7563565e89.webp)

![](images/ced5251c691a786388f7cf1c2f9e883a58eb79ca92b29a0604cca0b11a50aad8.webp)

![](images/d7c9782f34f2c6b67126a0fa49c62719786cf8903f64325fe4e43647e91c1dc1.webp)

![](images/3706116a0193e81495ef133a50135bf8ead187f4c7e38c1e1cee633f82b89baa.webp)

![](images/cc0cae823a5a5ed30ac911df9ddcae0c19fe742367faba396ce9b5b6ec42337e.webp)

![](images/d4fb0917f2d444ef60e0786fc081372160142ea14462458157d1c889a1eb2528.webp)

![](images/0eaa0735b47e1b35f3944d0f657afe89f6dd8b879d07cca8656eebd595514d49.webp)

B.Unscrew the bolts and remove the air conditioner mounting bracket.

# Installation Notice

![](images/f8578642d5f26d4760db6470546e4e3833ec0d0ddf11891837df37f4ef4dc1e6.webp)

Remove the PCV valve assembly.

A. Remove the PCV valve hose.

B. Remove the PCV valve hose connected to the engine oil hose.

C. Unscrew the PCV valve mounting bolts and remove the PCV valve assembly.

# Installation Notice

![](images/bb3c52b529f8f543a940e2851498185c8d98d2fd1b212b3e589b8fa95be32afd.webp)

10 Remove the oil dipstick tube assembly.

Unscrew the bracket bolts and remove the dipstick tube with O-ring.

# Installation Notice

Insert new O-ring into the oil dipstick tube before installation.

![](images/cd301d808a654b27a5f686cc35e410a48bbd92847afac5a3510eebfcf58ffcd1.webp)

# Installation Notice

![](images/01129a4d2f9cce3acfc639d11894fc494c89f643cc5ca3bc95bdd4b923acbb30.webp)

![](images/bb543079b75e5747e19e4cb855d2c8054303a8469508358c5851e3f507a6895d.webp)

1Remove the turbo charger assembly.

A. Unscrew the bolts and remove the oil supply pipe.

# Installation Notice

![](images/0d63ed1a4b56dfc8c318de9f576c7296e2842b5ccc805ce9af1e87e687e49178.webp)

B. Unscrew the bolts and remove the oil return pipe.

# Installation Notice

![](images/32eaee2ef649168ae1904e6e71fcf686fe92248d83aa38c99fd756f3efa541e5.webp)

Make sure to install the gasket with correct direction.

![](images/1446928e8cc008ed86e79761c2eec47fa9641d68723dd09995e2638ccaf2cafe.webp)

![](images/040c73fb678041995c7a7ac740263f476da510cfcc5ea38923fceb6232cbf34a.webp)

![](images/69cd1ca4e45179dca4ddba2d6a0ca08eb9fe623501afe6d649dcb4debbc058e6.webp)![](images/a71a0990bd59f50eb0dd7c36c4795ba8ac2aab256542717c1fc925e17779442d.webp)

![](images/735b30d32f76c1f75800f51df092760e0bb9c76707859fe357f7020c5f0d299a.webp)

C. Unscrew the turbo charger mounting bracket bolts. Installation Notice

![](images/59b591372968c9cf0904ac37ddbd26d5f9b33f7055ccab3aeda9c2c0878b22eb.webp)

D. Unscrew the turbo charger mounting bolts to exhaust manifold.

# Use only 12 1/2 wrench.

Installation Notice

![](images/ad9bf8fa246dc20ebec68f8b9004f7a872139a4c2727f41b5b6840c596dcc672.webp)

E. Remove the turbo charger assembly.

1Remove the alternator assembly.

A. Unscrew the bolts and remove the alternator.

Note Alternator Capacity: 140 A

# Installation Notice

![](images/ed4f5a507365b30860182c0def2e54cb2c612ed4360e8f2ca5fcc2a1ba314ac9.webp)

# B. Remove the alternator mounting bracket.

![](images/2930909e8fec0664f9d9d974a8a83ddc5d848c19cefc5d9b4154fdcc5764dd2c.webp)

![](images/f5dd97fc4eeecda93dba5f949297cbb7a192d0fc2133c048a08bcd5ac603a3c7.webp)

![](images/e7ace6836d7db34467f74faa99da82abc83eba768eb1b37c01fd4ddac8ec1b51.webp)

# Engine - Disassembly and Reassembly

![](images/9186803d5263ef316b3a9d16b5d6ebcb37d3869c410eb55dbb367130cc04b85e.webp)

![](images/3fc54e3f147c5a52a452f42837826164051280cf7db005512eba8b86cb8db5f5.webp)

1Unscrew the injector nozzle holder bolts (12-sided) and remove the injector bracket.

Installation Notice

![](images/a6887dbad420ce7b05e9c0230700d1019d9e0d5a9a5c71473cdb5f4373a5d6f3.webp)

Remove the injectors with a injector extractor (special tool).

# Notice

•Be careful not to take off the sealing caps on the injectors and fuel system.   
•Replace the copper washers with new ones when installing.

3. If the copper washer is in injector hole, remove it with a special tool as shown in the figure.

![](images/7716e61a56ed1a735aba18239bd97ea8c2df95f3fa56ab5fc0d22d09d1450169.webp)

4Remove the glow plugs with a special tool. Installation Notice

![](images/58ac548fb964bfcd90f49fd5fd8fcb18c79f101ca860c3401e953b15ff570b30.webp)

![](images/2f636903dc3e6d92b3dfd645da2029e5e271955873cb4cffc307d6576cecb36c.webp)

5Unscrew the Torx bolts and remove the common rail from the engine.

# Installation Notice

![](images/efc27d28bb8838a038c3a1e4a411de008cf8378691684228d53b0aa4f4f2ac8f.webp)

# Notice

Plug the openings with sealing cap.

![](images/a96e40f1003baa2577c9a9d489e3619c4035016a2db1bc5c525db4b2303e27da.webp)

6Remove the booster sensor from the engine. Installation Notice

![](images/579aa548de07bb22a273f152fcc15d1635141582a27fa89517b1c566d101745b.webp)

7. Unscrew the bolt and remove the camshaft position sensor.

# Installation Notice

![](images/deb55d120fde4869f69dd1c6587e1876b764a307a80eebd88befc208cfa1f793.webp)

Apply Loctite on the thread before installation.

![](images/4115f41887bd235a9baa762d02c3c93e652ae2e6202c4017c5d57306cb8cb885.webp)

![](images/58ddd61f5413394c1f61ae696bc61da49887a55423079805d3d75a45975b56d8.webp)

![](images/7c00fc6a55e4acb367d606756dcc10c6f0afdb93730f25d5e8e35a91a30e478a.webp)

![](images/843ef3729ec876e1eebfce4285138d5c7b4666846ed23f70c1549d9fb1fe4aee.webp)

Unscrew the bolts and remove the cooling fan pulley while holding it with a special tool.

.Remove the cooling fan belt idle pulley while holding it with a special tool.

![](images/006786c843ddad1f2c75545cecc7db418551a6e555dbd11631f8288e60ff76e5.webp)

10. Unscrew the bolts and remove the cooling fan bracket assembly (timing chain cover).

![](images/7ed9b48f10c84764478581d61842c53f7619f746cf04a33ab6e4674752b84368.webp)

![](images/ae095c80f72bfc8cc15f52bcf3132ef78a064e511bc8bc75e1faf14134e6c3e3.webp)

![](images/df3655dd320c493f2da713e595f5b8b54f23c4b5d99af19d66aa5e1f55d81f05.webp)

11. Unscrew the bolts and remove the cylinder head cover.

![](images/4850513135324d74558d31c334cd846aa2de61664b487c0d2d94aee690b7e694.webp)

12 Turn over the engine and remove the oil pan.

Installation Notice

![](images/ca5c4b444ab1a395ed5b2ff66936f11577cb06e6d16147cd06b435ed0fb67b33.webp)

![](images/98daea2dc57b2e840fa8cd3087e67e4d787b5bc95ec83492656889328bc42915.webp)

Installation Notice

Remove the oil seal residues from the oil pan and apply the liquid gasket on the parting surface.

![](images/f39549e3350e7966af0463020c142cd49ed28e5843bab1117f980d4303ce08ef.webp)

13. Unscrew the nuts and remove the exhaust manifold. Installation Notice

![](images/75843f560888d83be3cb44e1a6e18e1ebc2c9fecdc12287e1c76fc96a07f5d8c.webp)

![](images/c40407cedf201b5d883b920ec1fa7a9befc575f992f3fb28e30555aac7efd5c7.webp)

# Notice

The exhaust manifold gasket is removed along with the exhaust manifold. Mark the installation direction to prevent wrong installation. Otherwise, it may cause a sealing trouble.

![](images/b45c7c8d62546cf5482bedb3eb2b4597bafe38224010ade2562da6836800f458.webp)

![](images/0d84ee8ccecbdc25f1d9f59dfc5bc2bd7c82f2554283ba97d4d670ffdff37a5e.webp)

![](images/6b2a531866c91db2dc068e2d2f1f2295babcea985734ea5c0e98f693286d2800.webp)

14. Unscrew the bolts and remove the thermostat. Installation Notice

![](images/bb05121e2be6d77056f7fa7aaa833d86565d05a3eb72083648f86beeda4d67e0.webp)

# Notice

Be careful not to flow out the residual coolant.

15Unscrew the bolts and remove the water pump. Installation Notice

![](images/9e3a08f99a74dec4d39197c11100d3846723fd0817ec3fe57f0f4d1a041d1394.webp)

1Unscrew the bolts and remove the water pump housing. Installation Notice

![](images/fde0888f9996409469a8953bfa47d4991335c9fcd29b010e26f32830c33d1f79.webp)

# Notice

Be careful not to flow out the residual coolant.

17. Unscrew the bolts and remove the coolant inlet port from the intake manifold.

Installation Notice

![](images/5c106486c2b8f882be62f7abaa9b0f3f40a7c9ac151974342d0dd89c4206b08d.webp)

# Notice

Be careful not to get the coolant into the intake manifold and engine.

18. Unscrew the bolts and remove the intake manifold assembly.

Installation Notice

![](images/5364dba147684d19b8b26b996bc51e693fcc8409e65088619b11865df3cf348f.webp)

![](images/da0da4b15b86876253b4dc1ce607b9ec47117022d02d128fb366d330f6b77b78.webp)

# Notice

Replace the gasket with new one once removed.

![](images/13e1f0fe8ff11a512293e902479d84693185ac9922eee13762a96d108d3ddb10.webp)

19Remove the vacuum pump from the cylinder head. Installation Notice

![](images/fc7a7da4849bb2c51a52a7a06f505b8df9cb53bfe87892a13ff982976b51f704.webp)

![](images/ad5d42582ec42e255d2d89a043ce92369d22c7a20aeafc857f95966397def81d.webp)

20. Install the engine lock (special tool) onto the flywheel ring gear so that the engine will not rotate.

![](images/b34417341df72e6ff20fc3527b25d27af8b657e9c5f810cb9b3431e7f372f02e.webp)

![](images/b55e0b6ddea1dca2ed5a2e038a2ac97269489ed9bf7074d783100afd9c6830c5.webp)

![](images/205852d2db5ebff2fe942927aba906cfcbc8a818d28899a265e240f7aba52141.webp)

![](images/8932c40c1961ec4a6624046981eaa134ff6d5843052ce59d3b3090685a24d20e.webp)

21. Remove the chain tensioner.

![](images/5ada90eb491ca443f5a97c5d0d1b20e2caeaa75cf62d99a2e6cdfe24a07b1a0f.webp)

Preceding works: removal of EGR pipe and oil dipstick tube

![](images/597b402829707e16b0b3a6d9b6f36893833be62e16fe14b95c6a9c1b03cff32b.webp)

22. Pull out the lock pin and remove the upper chain guide bracket.

23. Unscrew the bolt and remove the intake camshaft sprocket.

Installation Notice

![](images/f7a0666d080f70331c93f9a6c0c53e5c664cdba20d52ff71cabfc7fc3de09f6d.webp)

24. Unscrew the bolt and remove the exhaust camshaft sprocket.

Installation Notice

![](images/0b8f713e829171f163d2903c8788685b87e33ff0c359f1d390ced2b5f239ab44.webp)

25. Remove the camshaft bearing cap bolts so that the tightening force can be relieved evenly.

•Intake: #1, #3, #6   
• Exhaust: #7, #9, #12

\* However, there is no specific removal sequence.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11

\* Do not remove the bolts at a time completely. Remove them step by step evenly or camshaft can be seriously damaged.

# Installation Notice

![](images/8b9abd67db81a5a801500b65ff9595d0ee5569e11935489cf20abb4f24d7d7d5.webp)

![](images/97b2ed48e17a956095b0d68ada57d948b6b4aa87055660ecb252a86f38b6a1e3.webp)

26. Remove the intake and exhaust camshafts from the cylinder head.

![](images/6340eedbf214c00073027fbdddffea9bf0b23cf434cfbb56f5bb94bdd2d91d05.webp)

27.Remove the finger follower and the HLA device.

# Notice

•Avoid contact with hot metal parts when removing the HLA device immediately after stopping the engine.   
•Be careful not to be contaminated by foreign materials.   
•To prevent the oil leaks, store the removed finger foliower and HLA device with standing up.   
• If the HLA can be easily pressed in by hand, it indicates the oil inside of HLA has been flown out. In this case, replace it with new one.

![](images/595ec0ffba731ab6c418e8f61db9b33c3caf23e85e63fe235083f6985482d4ae.webp)

![](images/6165eac5cb9ef035d2c3568787ba7f31f5e64e7f57687fe7b034b2233d9eefe1.webp)

![](images/db4047a2e97e3892b1d953e9d195d59fa2a99cc739c421720e82cbe7eecc3a03.webp)

28.Pull out the pin and remove the timing chain guide from the engine.

![](images/8d9ebfcd9118cdf3c1f40a5fab34c95a07675c56c124d79abefc32fba306e34f.webp)

29. Remove the cylinder head bolts according to the numerical sequence.

Installation Notice   
![](images/81cb5ffdcfe7a26dcea7b864dc33530a06501ad8f346ac40396e58e974f33ae7.webp)

![](images/d6e52af3db124767e9c23263a908bfef056be318aa10831f15a6075e2961bda1.webp)

30.Measure the length of cylinder head bolts.

If the maximum length is exceeded by 2 mm, replace the cylinder head bolt.

![](images/9f58395b6fedeb8138e089ad44fda078d916b09d7dae16609982d00e25b706d1.webp)

![](images/439db9b9e10ad68a206656b201f3b0f9e09c717c1a8061fd6467e9679f9bfd88.webp)

![](images/5a00e6a9728abf4d3771335c3a07191ed46bfd2aaea43aabe0b3caf36844d2b3.webp)

3Remove the cylinder head.

# Notice

•Inspect the cylinder head surface. •Store the removed injectors and glow plugs so that they will not be damaged.

3Measure the piston protrusion from the parting surface. • Specified Value: 0.765 \~ 1.055 mm

![](images/841873b2482c58190f4c1a16ce606aee500b53a717a84a666218941540d44291.webp)

33 Remove the cylinder head gasket.

Installation Notice

• Replace the cylinder head gasket with new one. Make sure to place the “TOP” mark upward. 1. Put the steel gasket on the cylinder block and position the cylinder head.

![](images/53877e2d68c3348e0bbf2b232151f2e1f5e25588e6afa19135718708edd653b3.webp)

Tighten the cylinder head bolts to specified torque and torque angle.

![](images/657e109a3a4ea3981db376fbe509f761426290cb710237e8b0d144cb44e8e920.webp)

•Apply the oil on the bolt thread when installing. •Always insert new washer first. •The bolts (12) at vacuum pump side are shorter than others.

![](images/c5fe2e9ea1382b86de54bd63b7489de428900f03f23a8f29b0ff2ed87f9c4fc7.webp)

34.Turn over the engine and remove the bafle plate. Installation Notice

![](images/2cf8afd1623f8e92b9b40001a655325b7b9beb1803391a9a21767936053eb0d5.webp)

![](images/1ed153cea7ed607865b56d2cd60b5e7260ec6fd5fd556ec587ea8371031296f5.webp)

![](images/581d1820bad9e57dadb013d54dc95a7d6f14516b26cbb9bf8ee9fac6d3311ea6.webp)

![](images/2a60386566b9c0ad3214ccf0a90d748719b00c6005df55a2a568640483981e21.webp)

![](images/3124a5f4fa6ffa174c8da55c950f1b16aa670349222ceb17a1e5d48ae16e4af8.webp)

![](images/88b0bf680193eda40c90740e719682549a7ffca3fe4219be65fc8f3cc2e16d40.webp)

35 Unscrew the bolts and remove the oil strainer assembly. Installation Notice

![](images/54448d7f26d8eb662efb6b5f5bf67b8131010419752c218dfb96ee2ccdb4e65c.webp)

3Remove the piston assembly from the cylinder block.

A. Unscrew the bearing cap bolts. Installation Notice

![](images/3e748fe59af258bf065c31ecda16a62e6c749596f035d27c11fbb83d48a14a2b.webp)

\* Tighten the bolts from #1 cap.

# Installation Notice

\* Align the oil grooves in bearing cap and connecting rod.

B. Remove the bearing caps and lower bearing shells.

C. Remove the piston assembly through the cylinder.

# Notice

Do not mix up upper and lower crankshaft bearing shells.

D. Remove the snap ring piston pin from the piston.   
E. Disassemble the piston and connecting rod.   
F. Remove the piston rings from the piston.

# Installation Notice

Replace the piston ring, bearing and snap ring with new ones.

37. Lock the flywheel and remove the center bolt and crankshaft pulley.

# Installation Notice

![](images/6b0b955976a7da0b4df3db88ccea55b382b1ffd63c54bd77b081a513e515faee.webp)

38. Remove the timing chain cover assembly.

A. Remove the cover bolts. Installation Notice

![](images/662f46f5d8864329b2edce8e12ff2c7f1aa7e0643d15c74137497349d258e64f.webp)

![](images/4d6e45049fad9c7b5f7f43ca08581b5b78cdb9dcd29d5909d425c4068fe17dfb.webp)

B. Hold the timing chain and remove the timing chain cover by tapping it with a rubber hammer and a screwdriver.

Installation Notice Apply the sealant on the parting surface.

![](images/a524aed842c7783ae412f6774cd794245dc7c0e1ea7010f2161090fd4e741dc1.webp)

![](images/23fa51ff11c87a9008b1c26a57e11c80ee76ffb6978f80dc6894560734cbcf17.webp)![](images/45bb4ae4e95cd311777345f803757e3d7b2b03787ef7579cee6cc118737bc7bf.webp)

![](images/3662e180b58c52a713982340bd29c00f22baa3c963f18499468a3dc9c03fa3fa.webp)

39.Remove the timing chain guide rail and timing chain.

40. Remove the HP pump bolts and the HP pump bracket bolts.

•Remove the HP pump assembly.

41.Remove the crankshaft sprocket with a special tool.

42.Remove the flywheel and the crankshaft strainer. Installation Notice

![](images/96a9d870040c09dae6857b48e7b6fdd89168945972524e6f6fdcf5a24bffb8ea.webp)

43. Unscrew the bolts and remove the crankshaft bearing caps.

Installation Notice

![](images/6f44af8a2cafc14621cc5f1ecdaf09976cbf2cf78865e382e5f21817554562a1.webp)

![](images/5bf68ad8c78311c749150705952d83ebdc31008554b0f2c91e0518b64784fa68.webp)

# Notice

•Remove the bearing cap bolts from inside to outside with a pair.   
• Do not mix up the crankshaft bearing caps and shells.

![](images/b6d5d8db1fe559643d723ab2fc2469e531a9886c9a7ca06bac48483bbfa1be05.webp)

# Note

•Install in the reverse order of removal.   
•Tighten the fasteners with the specified tightening torques.   
•Replace the gaskets and bearings with new ones.   
•Make sure to install the gaskets in correct direction.

![](images/c9369ceb0e4d5d6880e83a30b86e88a36c323341e78e50399479f8a11564f465.webp)

![](images/05cb996da159849db4d7874516e21bb107183411fb7892bb41f0f5f2c48dedd8.webp)

# CYLINDE HEA/.YLIN DE BLOCK . MI2-3

Cylinder head. DI02-3   
Camshaft assembly DI02-17   
Timing chain assembly. DI02-25   
Cylinder block DI02-29

# CRANKSHAFT. ... I02-332

Arrangement of thrust washers and bearings .... DI02-33   
Torsional vibration damper .… DI02-38

# FLYWHEEL .. ... DI02-42

Dual mass flywheel (DMF, Manual transmission equipped vehicle) .DI02-42

# PISTON AND CONNECTING. ROD . . 4

Piston ring... DI02-45   
Cylinder inner diameter and piston size .DI02-46

# HIGH PRESSURE PUMP (HP) ... . 251

Components locator DI02-51

![](images/da2b3f03d4c97c4b12cf1b0ce52f4c814e614c91742c6d35e6c52c625a4aa6fd.webp)

# CYLINDER HEAD/CYLINDER BLOCK

![](images/48be20f647573c0aceec472d0d0cb3b272dd18bd1079c7b01285d4e0f4db7b11.webp)

![](images/6e898f3045ac1fa6f174a37c3f389fc9beb7e63e80c4d504a50b6e5fcbd3689a.webp)

Y220_02001

# System Characteristics

•4-valve DOHC valve mechanism   
• Swirl and tangential port   
4-bolt type cylinder head bolt   
• Water jacket integrated casting   
• Integrated chain housing and cylinder head   
• Oil gallery: drilled and sealing with cap and screw plug

![](images/9a6bf53ed57d0893c25a24d6486947bdc2b9cff6d79fe9513302a929a3a974a0.webp)

![](images/a29969d9ca0838d720c3c3b22c307faa7839f4f0ef1910d9df6f6dd5ade0e24e.webp)

# Cylinder Head Pressure Leakage Test

Preceding Works:

-Removal of cylinders   
- Removal of intake and exhaust manifold   
-Removal of valves

![](images/0d7acbf608c90d9c7812284ef1063086d09f51913400e7a91c7fe881a6919d88.webp)

# Test Procedures

1. Place the pressure plate on a flat-bed work bench.

Install the cylinder head on the pressure plate.

![](images/be28ade39df5977d59643d0223963d8ceab8876a23c6367322d81cba38e936b5.webp)

3. Immerse the cylinder head with the pressure plate into warm water (approx. 60°C) and pressurize with compressed air to 2 bar.

# Notice

Examine the cylinder head for air bubbling. If the air bubbles are seen, replace the cylinder head.

![](images/e85719d6f37b25c41c5f3d7b8352d1e66ee438b2c7877480e1a4ec23b9da9a3b.webp)

# Cylinder Head Parting Surface Check

![](images/0037361c12967a25071d8c16fc28ad3672cd1a567bfa5a78b69dee06ce720fc9.webp)

# Measurement

Measure the cylinder head height “A".

![](images/504900d33f953d57a5623d63641598e0ed541e5d23d7dd4cda9f668baa259551.webp)

# Notice

If the height is less than the limit, the cylinder head must be replaced.

![](images/baaa592d920de9046bd2cb5cc5344087d020c5e8d1a9ad7049586a9d022178ae.webp)

2. Insert the valves into the valve guides and measure the recesses.

![](images/d36f76f0312deaca289fb7d862b968a60e14e7373a52c77fa675e8d0bea68ef8.webp)

# Notice

If the measured value is out of the specified range, machine the valve seat as much as necessary until the specified value is achieved.

![](images/1a2e8b5809fbb054564acf4b186a30dbde03337a821b8007d9444a70fd07f730.webp)

![](images/82fd8add917780ded8dc560ca31e65a1f451dd359fbaec9cf43fbf9e480591b9.webp)

![](images/3461391fdbc8af77c28388507068dfa99ff80d8ba4e858ec21279a1c1f969791.webp)

![](images/9bf1ef89cbdc532889054ef3bacc685935a8149ed5ce3598c9ebfcbbd71e21a8.webp)

![](images/ae8e1446a2cf6e457c108867ad9fc7c59b749d58e63ebf48f8b5a575b73be726.webp)

![](images/8227828582e673ead5ce87a059a7427e1c7e704b611e04fee4c80ce831666830.webp)

# Cylinder Head Disassembly and Reassembly

Preceding Works:

- Removal of fan belt   
- Removal of fuel supply and return lines   
- Removal of EGR related pipes   
- Removal of intake manifold mounting bracket   
- Removal of injector fueline and connector, and glow plug connector

# Notice

• Plug the openings of injector holes and common rail with the protective caps.

1.Remove the cylinder head cover.

Remove the camshaft position sensor.

The intake manifold can be interfered by the sensor when installing.

3. Mark on the intake camshaft sprocket and exhaust camshaft sprocket for timing setting during installation.

4.Remove the chain tensioner. Preceding work: removal of EGR pipe and oil dipstick tube

5. Hold the camshafts and remove the intake camshaft sprocket and exhaust camshaft sprocket.

![](images/216b43c941b627d52ff3045c627d21da0036544de3f2fc45ea00886ab2c064bc.webp)

6Pull out the lock pins with a sliding hammer and remove the upper guide rail.

Correctly align the electronic control module onto the shift plate by using two central pins when installing.

# Notice

7. Remove the oil cooler, then remove the intake manifold.

The intake manifold can be interfered by the cylinder head bolt (M8 x 50).

![](images/96dcb12e31322c21bd2a8e5429a9a0a5ec813560fd8803233c3b1f325ac1c95e.webp)

![](images/41939f0a098a694852574b4e7eca5b4340a67bef1faaf7eb12a77ace7d0c7aff.webp)

![](images/c380b75d179ebae75276868f26c6cba6e0ecd8a82361608c53dd95d2579e7f98.webp)

8. Remove the cylinder head bolts according to the numerical sequence.

M8 x 25 :2EA   
M8 × 50 : 2 EA   
M12 x 177 : 11 EA   
M12×158 : 1EA (Vacuum pump side)

![](images/8e6756d9fc249580ea906f1e11ae399038961a817abe0702fa414af821714b78.webp)

Measure the length of cylinder head bolts.

If the maximum length is exceeded by 2 mm, replace the cylinder head bolt.

![](images/06057cc4254b759dcb4a8eed62533d306b5d0d9882b1308ec36def47a80108cf.webp)

![](images/8fec1ad01fb075b8aa94ccd0fae0f69a20ee9822d1f700d65568f9abaefa3c31.webp)

1Remove the cylinder head.

# Notice

•Inspect the cylinder head surface. •Store the removed injectors and glow plugs so that they will not be damaged.

![](images/b8caca376e8a72df5cd26f870e5706ba1be05755cff1d5c3801d153b4af5dc39.webp)

![](images/c8e0ebc1fadc6a97bef60e6b502d17e7265fd318a3ad373fbf466d1a21d08687.webp)

11Measure the piston protrusion from the parting surface. • Specified Value: 0.765 \~ 1.055 mm

# Reassembly

1 Install the cylinder head with the steel gasket.

# Notice

Make sure to place the “TOP” mark upward.

![](images/17052b30543061d1752f82a768d76e4f447625c52240d5fea85961429afdcc97.webp)

Tighten the cylinder head bolts to specified torque and torque angle.

![](images/8b053a4f5361c299f677e6706dff18399fa66ae41ddd8f97f1bcc34ce0a124c0.webp)

# Notice

• Apply the oil on the bolt thread when installing.   
•Always insert new washer first.   
•The bolts (12) at vacuum pump side are shorter than others.

3 Install the HLA device and finger follower. Check the HLA device with the diagnosis procedures before installation.

# Notice

•Put the cylinder head on the locating pins.

Tighten the camshaft bearing cap bolts.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11   
• Exhaust: #1, #3, #6   
•Intake: #7, #9, #12

![](images/ce8e26f380db7eccad5f80917f19cf3e33fcc523313a3df4badc540623da03cb.webp)

![](images/2440040296f15520d4cb8a4ae3bfc082140aa9be62b5b25469183e2fd9751ee7.webp)

![](images/2db8d5c42454fcbcd9effc8bf56f6f8c0bded2a09e2fefb4141e4bd36275826b.webp)

![](images/5d724a133b24b40d0178bf3a8c018ac58784f3fe11930114cfa5e74acb170911.webp)

![](images/78ceab3e36a60a593963608c2e8ae5a779b8c2ecd456626a376933c43cdb86c2.webp)

![](images/f922e498129212c1a3f1e1d366823d19a403603ac492f95abd3c06ce34fb9619.webp)

# Notice

Check the finger follower positions and align if needed.

5. Install the intake and exhaust camshaft sprockets and the timing chain.

![](images/755d62ce70843bb3cb26cff463d14518e3e5762af43118504811cef6dbe29f0a.webp)

# Notice

•If the sprocket bolt is stretched over 0.9 mm, replace it with new one.   
•Always install the intake camshaft sprocket first.   
•Ensure that the markings on camshaft sprocket and timing chain are aligned.   
•Make sure that the timing chain is securely seated on the guide rail.

6Rotate the crankshaft pulley two revolutions and ensure that the OT mark on the crankshaft pulley and the OT mark on the camshaft pulley are aligned.

# Notice

If the markings are not aligned, reinstall the cylinder head.

7. Place the bearing cap with the OT marks on both camshafts facing upward.

# Notice

• Apply the sealant on the cap (#12) for the vacuum pump when installing.   
• Apply the oil on the bearing journals before installation.

8. Fit the timing chain onto the camshaft sprockets and install the upper guide rail.

•Instal the clamping guide rail pin.

# Notice

•Install the guide rail with slanted side facing forward.   
•Be careful not to change the timing of HP pump when fitting the timing chain.

![](images/a8d2e1d71d13a0f3b6ec1e2ad000cc9af6c029a0f811b467cd4d5c5cc1220b3c.webp)

Tighten the intake and exhaust camshaft sprocket bolts.

![](images/be58375985cf15dbd5af60b7f6a19603c1ec673ead402d7d039bdf8b9f97b978.webp)

![](images/a0ab46ecb5228b7449cd50789969dfe5c466535a7880c11e4248899f6347903a.webp)

10. Install the camshaft position sensor.

11.Apply the Loctite to the bolt and tighten it.

![](images/395db9b92bc798d99a464fa64b7effdac41aba119f9357b18fc95d207ad0844b.webp)

12.Check the intake camshaft before installing the vacuum pump.

![](images/78dc7dbb861030f0109bf10c703f5ac3a8446300da492ad6077e17b2617d2716.webp)

13. Install the intake manifold. Install the oil cooler with new gasket.

![](images/4706af63a6bcf343168d3bc170e1953dcaf430e89aadf2838b4109b9fb7beb07.webp)

# Notice

Ensure that there is no leaks around the coolant line for #1 cylinder

![](images/905c5c905396f3daf81a926c97d116a004b24e6614205c93dc8b8f9d61bb3873.webp)

![](images/c69a1adcadc5e95ea4295b7cdf2853c388f87eef4cdfdc289fb7eb39d3338a2d.webp)

![](images/f0c54c49564a0a3517279b5dffdf4521ef72b0f4bbc8fb6aa1a9f6fdb485bc6a.webp)

14. Install the chain tensioner.

![](images/9fdcc81606963af0ca7829a0ae21f44d363681eaaf93d52cd8825ef4bbb4c42e.webp)

![](images/62e7ecf7cd0c3eb807679ce825309c2425225756039ad3de9653ea2b94ef1b3a.webp)

15 Install the cylinder head cover assembly.   
16 Install the rubber gasket.

![](images/2c67c09515f7aa5dd63e7d8ffc4fbb1a673ed53a13c8e7ab1ad18cbdbb0babd8.webp)

![](images/2c5823872efa841cee8091df6272571894022c4a5de9e0eb7901034bd949d790.webp)

17. Tighten the cylinder head cover bolts.

# •Apply the sealant to the bolts for the vacuum pump and the timing chain cover.

![](images/9a900d6250de4fb4e9777ea27f2af26f1d4566a179dcd906548ffb8e5b4c3c9f.webp)

1Check the parting surface of the #12 bearing cap and the   
cylinder head for contacting.   
19Check if the O-ring is installed in the vacuum pump.   
20. Install the vacuum pump with the key groove aligned.   
21.Tighten the vacuum pump mounting bolts.

![](images/88fbc0be15b7bb22d5a83dd9b654e2329484421dc1e95f99180e851575c6b6a5.webp)

22.Instal the PCV valve assembly on the cylinder head.

![](images/399d50f097f25f024555bdb9c00d206f57634a1cab5a6b33f7d69781dc365097.webp)

23. Engage the engine oi hose and the PCV valve hose.

![](images/bfbfd9bc16c2aece43ba04cbc4f344580fa9b748bb95eff6cd25bf0ad3482412.webp)

24.Remove the protective caps and instal the new fuel supply pipes.

# Notice

•To keep the cleanness and protect the components, the fuel pipes should be replaced with new ones. •Be careful not to be mixed the fuel pipes because the pipe appearance of #1 and #3 cylinders and #2 and #4 are same each other.

![](images/bf3a53d9e6e7af334a7b06a6a73ad6704fd66237b5e655910bd7354fe79c7976.webp)

![](images/5be034a8f03ad3dc2ca7ca89834b393bc804b3245d1b85663c00a4fe8c307908.webp)

![](images/ce006a997200e448dd0e0a59b4228c047baafc59a4f49b822acff0f07d23e377.webp)

# Intake/Exhaust - Removal/Installation

Remove the cylinder head assembly.

![](images/83bc172c67740c282abf84f016ee5c386916ffe031f5b7434a9a6e1c15984e86.webp)

Instal the removed cylinder head on the assembly board (special tool) and set the supporting bar and lever (special tool) on the cylinder head.

3.Push the valve spring seat down with the lever and remove the valve cotter, valve seat and valve spring.

![](images/e8c23bb6875efa5896e2f8f7ec894b862026a86aa53f001622140b5d3277a91c.webp)

![](images/56598659f257148cc19a63cbc6c4399fd087426181f96eba9a2fb0d92f023e79.webp)

Remove the valves from the cylinder head.

# Special Tools and Equipment

![](images/a88bad502ec98fe866946594ffc432153619a9ee07e321dbbd6d8c849fb09f70.webp)

![](images/ccbdf2dc1a155433a30423488f8f054df6a2ef01ea0f784f8d78b8ff2271ed80.webp)

![](images/0217781d5e46a9c6f2b46c347951399cc35c744d9546002e6a11672234b227cc.webp)

![](images/0a0dab5af50173991647969ee04a04caab19ce636a389801ff776d602a1c332f.webp)

# CAMSHAFT ASSEMBLY

\* Preceding Work: Removal of cylinder head cover

![](images/e8e7bdf01c928a0909c9c1d9fef546baa8f3b2ea56676ef7eef29dae3507192f.webp)

![](images/2a11304983b4ba87828d78d357feba8bd1ced5bb6e716cc91e7f6fa3f1a55f25.webp)

# Camshaft Position Sensor

![](images/612c92b37febd1ec0e032af31eac0b6f3ac06feb9aadf43ebb8262f0a4779ce1.webp)

The camshaft position sensor uses haleffect to set the camshaft position and metallic-magnetic-material sensor end is attached on the camshaft and then rotates with it.If sensor protrusion passes camshaft poition sensor's semi-conductor wafer, magneti field changes direction of electron on the semi-conductor wafer to the current flow direction that passes through wafer from the right angle. When operation power is supplied from camshaft position sensor, camshaft hall sensor generates signal voltage. The signal voltage wili be OV if protrusion and camshaft position sensor are near and 5 V if apart.

ECU can recognize that the No. 1 cylinder is under compression stroke by using this voltage signal (hall voltage).

The rotating speed of camshaft is half of the crankshaft and controls engine's intake and exhaust valves. By installing sensor on the camshaft, can recognize specific cylinder's status, compression stroke or exhaust stroke, by using camshaft position when the piston is moving toward TDC (OT). Especially when started first, i is dificult to calculate the stroke of a specific cylinder with only crankshaft position sensor.

Accordingly, camshaft position sensor is necessary to identify the cylinders correctly during initial starting. However, when engine is started, ECU learns every cylinder of the engine with crankshaft position sensor signals so can run the engine even though the camshaft position sensor is defective during engine running.

![](images/03b3b51332e6682cee388d61c74a7ef7cd1b2fa0375877f39af5623a7eb010e4.webp)

![](images/5b9d4e6174b24108af10debcb7794557bf445cd069323588e759a8be2ea1fec8.webp)

![](images/f8a2311016c4d13a0054c9b00333a9ad48faf474e1cb283d65a08a6c4a5fc003.webp)

# Removal

Preceding Works:

-Removal of fan belt -Removal of fuel supply and return lines -Removal of intake manifold mounting bracket

1. Remove the injector fuel line and connector, and glow plug connector

# Notice

Plug the openings of injector holes and common rail with the protective caps.

Remove the cylinder head cover.

![](images/fe06edd6538547c251f0478706bfc6ed28f66461c6c72c0f29e331dfe6df5aad.webp)

3Remove the camshaft position sensor.

![](images/8d172a4dcda3349c71b21d9a73657d196b7066bf96deee96334a776bdcbc7d09.webp)

![](images/5cb4543f167ff1bd037922d78b022ab1699335df30cf3b4bc7993dcfb39c25c5.webp)

4. Mark on the intake camshaft sprocket and exhaust camshaft sprocket for timing setting during installtion.

![](images/b9309816868325d11bacfe9989db1c20df94404615c15f063600b44e7a9b65ac.webp)

5Remove the chain tensioner.

\* Preceding work: removal of EGR pipe and oil dipstick tube

6. Hold the camshafts and remove the intake camshaft sprocket and exhaust camshaft sprocket.

![](images/b1d4148eebcb2439fa90204b560b76c96f1f04f5c3ba06893ae0a904c4446309.webp)

![](images/4214be45d1137eb5dac9202ea4873867934da84ba17eb8cf654d2808d8a1a422.webp)

7. Remove the camshaft bearing cap bolts so that the tightening force can be relieved evenly.

Intake: #1, #3, #6   
•Exhaust: #7, #9, #12

\*However, there is no specific removal sequence.

• Intake: #2, #4, #5   
• Exhaust: #8, #10, #11

\* Do not remove the bolts at a time completely. Remove them step by step evenly or camshaft can be seriously damaged.

8. Remove the intake and exhaust camshafts from the cylinder head.

![](images/aa769cbc0186d6294f0e0f1a63294d7fea52a56f9bd4f5e28ec1d4745591c01e.webp)

Remove the finger follower and the HLA device.

# Notice

Avoid contact with hot metal parts when removing the HLA device immediately after stopping the engine.

![](images/fa2c497970602e4e8550d44adc93920b0bf4d503e3df63fb22a03471707bf66a.webp)

![](images/c90d9d7629104f4fed50f16dc4bb32c25bd0326c517e8a2a71d8df290d0e9771.webp)

![](images/45c4ba61a9488407da759c89c7842901015c20972a083efab0ef0e0e3f708ede.webp)

![](images/e0832eb1fb26acc8a48eb8bc5571620cb380968927313aaa6c40654fea4492be.webp)

![](images/bcf8cf1f519dd1b10effbeeb25d965b7d15aba5f6afc921169b3e03c3cf9c06b.webp)

![](images/d0e38e5993d72df076d9abbec6d9c405efde9a43299a6a18f27c2f4db4bfd3b5.webp)

# Installation

1. Install the HLA device and finger follower. Check the HLA device with the diagnosis procedures before installation.

# Notice

•Put the cylinder head on the locating pins.

2. Place the bearing cap with the OT marks on both camshafts facing upward.

# Notice

• Apply the sealant on the cap (#12) for the vacuum pump when installing.   
• Apply the oil on the bearing journals before installation.

3Tighten the camshaft bearing cap bolts.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11   
•Intake: #1, #3, #6   
•Exhaust: #7, #9, #12

![](images/e4a5f9f0d2666df68474968ff41d21c35b6ab4eaef77bc5be600e19b9aa47cfd.webp)

# Notice

Check the finger follower positions and align if needed.

4. Install the intake and exhaust camshaft sprockets and the timing chain.

![](images/7e4303148a2c8757e536334238dd53936fb1fa9524e506fd798a96a9a3a0cea5.webp)

# Notice

•If the sprocket bolt is stretched over 0.9 mm, replace it with new one.   
•Always install the intake camshaft sprocket first.   
•Ensure that the markings on camshaft sprocket and timing chain are aligned.   
•Make sure that the timing chain is securely seated on the guide rail.

![](images/03b453ce732fb091c0acbfbda49e74dfed3deb77b1c4992b4e7a346cae2532eb.webp)

5Rotate the crankshaft pulley two revolutions and ensure that the OT mark on the crankshaft pulley and the OT mark on the camshaft pulley are aligned.

# Notice

If the markings are not aligned, reinstall the cylinder head.

![](images/c77fda9805e021cbe885c36e5e55b6f882afe6fde078656cb26f274670bd2478.webp)

6 Install the chain tensioner.

![](images/e0615500481b35dd38952cbf0ff4fec3e9eed22c76b567b97b9d3312b058e317.webp)

![](images/be0e613e3b650e918f7605a0a77bccf4003be158aa97ebe7a9082212ab804673.webp)

![](images/05b3cb5762204a2dd24ad53d0c1b080f6df4263a2851326f221795c691eab84c.webp)

# Special Tools and Equipment

![](images/934b1897c317b1d3672a7e3e0b2f22238aebde80e901b0c06a2c2451b6002a1f.webp)

![](images/c88a6229409c71de1f5f4987283af48627bfda73fad13a475e340767818e38dd.webp)

# TIMING CHAIN ASSEMBLY

Chain Drive System

System Layout

![](images/0d998db0e47467309d29181f25cdf44446215224885ed80878a80c49ae4946dc.webp)

Y220_02084

1. Exhaust camshaft sprocket   
2. Upper guide rail   
3. Intake camshaft sprocket   
4. Clamping guide rail   
5.HP pump sprocket   
6. Lower guide rail   
7. Oil pump tensioner   
8. Oil pump sprocket   
9.Crankshaft sprocket   
10. Oil nozzle   
11. Tensioner guide rail   
12. Chain tensioner

![](images/6bbc2b69437e6f48836882b8cc3f829c49ef2eef0a2454f0326e7aa3f37a944d.webp)

# Chain

Chain type: Double Bush   
Pitch: 9.525 mm   
•Load limits: 19,000 N   
No. of links: 144 EA   
• Overall length: 1371.6 mm   
Replace when the chain is extended by 0.5 % from overall length (Replace if extended by over 6.858 mm)

# Chain tensioner

![](images/c01311e3ce427c3758ed6fa6ab1a16290fb60a7849ff13a3bfa5205f1b3d620f.webp)

Y220_02085

The major function of tensioner is optimizing the movement of chain drive system by using spring constant and oil pressure in the tensioner.   
The tensioner performs function of adjusting chain tension to be alwaystight, not loose, while engine running. By doing so, can reduce wears of each guide rail and sprocket.

![](images/699d57e3d0cfdb661541e2a4a201384ed2c526971c010f87d1887abbd77428c5.webp)

# Guide rail

Guide rail is used to optimize the movement of chain drive system like tensioner.   
Guide rail can prevent chain slap when chain is extended and reduce chain wears.   
Guide rail is needed especialy when the distance between the sprockets are too long.   
The material is plastic.

•Location of guide rail

-Tensioner guide rail: Between crankshaft sprocket and exhaust camshaft sprocket - Upper guide rail: Between exhaust camshaft sprocket and intake camshaft sprocket - Clamping guide rail: Between intake camshaft sprocket and HP pump sprocket - Lower guide rail: Between HP pump sprocket and crankshaft sprocket

![](images/a9d505bc2631a2264e585078ba46448108a292c794621a111429b24ddd64f082.webp)

# Timing setting

![](images/c3f21494ae561e67c1de57a7014572eb2ae91459b68e7553d36a57bacc619af9.webp)  
<Timing marking points on chain>

Y220_02086

•Check marking links on the chain (Gold marking)   
•Locate a point with two continuous marking links and align it to a marking on crankshaft sprocket (^)   
•Align respective marking link to each camshaft sprocket (intake and exhaust) marking ()   
•Align another marking link to HP pump sprocket marking ()

![](images/6047598aec790366b45e57b6c655377018b169cb8708b8795e201306c03eece1.webp)

![](images/40cd5a4d03f1228ccfb00ac7e6bffc8c930e68c7bf8f573af3f03edb3444357a.webp)

![](images/bed82c39bfd3fb0414144cbd7b0265922d88880172c460b3e8ba0b856cce7413.webp)

# Removal and Installation

1.Remove the cylinder head assembly.   
Remove the oil pan.   
3Remove the chain guide rail with a sliding hammer.   
Remove the chain cover.   
5Remove the oil pump drive chain.   
6Remove the upper guide rail while pushing the retaining spring with a screwdriver.   
7Remove the lower guide rail.   
Remove the oil pump drive chain.

Remove the tensioning guide rail.

![](images/e58dfa7e1a80c6a6c2fb50e1f91daa8a0fbbfea91a2fc60889c1834417edd15f.webp)

![](images/98952d39341e7663adda5e625d52721c8d975b4c1c3b7af3f7951e42e358825e.webp)

10Remove the timing chain.   
11 Install n the reverse order of removal.

\* Thoroughly clean the removed components before installing.

# CYLINDER BLOCK

Deep head bolt thread to prevent the

![](images/19d0b6f5d15bd3ffc2d27122b3ddee189ee1343216e2f5082773c9568137eb56.webp)

Y220_02091

# System Characteristics

Rib design by considering strength against engine vibrations and weight   
•Cambering type skirt design on case housing wall to reduce the engine noise   
•Water jacket design to increase the cooling efficiency of cylinder bore bridge   
• Deep head bolt thread to prevent the deformation at cylinder bore surfaces

Reinforcement of strength - Main bearing housing / Main bearing cap - Extended main bearing cap bolt

•Reducing the noise, vibration and harshness (NVH) -Minimize the vibration by adding external ribs -Adding the ribs around oil pan parting surface

![](images/9e629fa88d713b970d802e6572bc1fbba06f9e992564ff1dcb25d696e18c5e62.webp)

# Knock Sensor

Two knock sensors are located on the cylinder block (intake manifold side).

To detect engine vibration under abnormal combustion, knock sensor has piezoelectric element fixed on the vibration plate and this vibration plate is fixed on the base. If happens knocking, pistons or connecting rods vibrate and occurs heavy sounds that hit metal. Knock sensor is used to detect those knockings caused by abnormal combustions. It controls idling stabilities and turns on the engine warning light when detects injector damages. And also controls pilot injection very precisely during MAP learning.

When knock sensor is defective, engine ECU corrects injection timing based on MAP values like engine speed ntake air volume and coolant temperature.

Before checking the knock sensor unit, be sure to check the tightening torque of the sensor and connector connecting conditions.   
![](images/74cbd9d2e3301a99700d21307f21493ab90eab576565efca3292bd83fb2dbe1f.webp)

![](images/10b18c9904c7eb6fdd0f9a08bae326e80f4bfab43bb05a2c799ee87b4f852305.webp)

![](images/fa44dd6685fd76737435056e07d44c530149af66b3bc5dc0ebf10a2461ea6e98.webp)

# <Location of knock sensor>

Y220_02092

1. Sensor housing   
2. Nut   
3. Disc spring   
4. Weight   
5. Insulation disc   
6. Upper contact plate   
7. Piezo element   
8. Lower contact plate   
9. Body   
10. Terminal   
11. Resister

![](images/331216d8dc294959a317d89cacd3926aa3e9288f8f5f4960aa0c97a3fc6602af.webp)

# Notice

The knock sensor should be tightened with the specified tightening torque. Otherwise, the engine output may be decreased and the “ENGINE CHECK” warning lamp may come on. The internal resistance of the sensor is approx. 4.7 k2.

![](images/afec436112df840a143f4fec2ff32173f760e2169ac46890215362a2f7aab6e9.webp)

Y220_02093

![](images/9c9e4fde1378498d70c59fd0299fb4bae2f9c7966dfecc14402197e0d3bb6cca.webp)

# CRANKSHAFT

\* Preceding Works: Removal of end cover Removal of pistons Removal of crankshaft sprocket

![](images/6700c8e5ff5e317e4e6dfb7b2ceb652028321780ec46f95afebf2d104ea12872.webp)

Y220_02094

3. Crankshaft main bearing shells, upper   
4. Upper thrust bearing   
5. Crankshaft   
6. Crankshaft main bearing shells, lower   
7. Lower thrust bearing   
8. Crankshaft main bearing cap   
9. Crankshaft thrust bearing cap   
10. 12-sided stretch bolt....55 ± 5.0 Nm, 90° + 10°

![](images/8b9281d32e192c1f9c9990522d00b71901d03badc6267689d4485f2bf303e8c7.webp)

# ARRANGEMENT OF THRUST WASHERS AND BEARINGS

![](images/35884a750e486a54813d497aa37e2c3ce0ae70025443df9dfe238a4ba1c43c38.webp)

Y220_02095

1.Crankshaft   
2. Crankshaft main bearing shells, upper   
3. Upper thrust bearing   
4. Crankshaft main bearing shells, lower   
5. Lower thrust bearing

# Notice

The clearance between bearing shell and bore and between bearing shell and journal are various. Refer to the table on next page to select bearings when installing.

![](images/817e05475889136c24c320f960336308c71a99c57e233d83dab47cd6a2aba2c4.webp)

Dimensions of Crankshaft Main Bearing   
![](images/84deea0637d5743047ff162d57d8a94d53003caf70aa9c45c7e96094f58cee08.webp)

# Bearing Clearance

![](images/8b4d1d1128f90a69b290d62610706186a1a699f89ef6fd18562b55fecdc53693.webp)

![](images/5704e44c1ae27fd73b680d5dc9fa56eb6c51c83db7d51c8b78310e5ce23a2ada.webp)

# Matching the Fit Bearing Journal Width to Thrust Washers

(mm)

# Notice

Measure the crankshaft axial clearance and correct if necessary with appropriate thrust washers.   
Thrust washers of the same thickness must be installed on both sides of the fit bearing.

# Matching the Crankshaft Bearing Shels to Basic Bearing Bore in Crankcase

![](images/e99b3fcf4ccfc87d7d440c53e6ec2e7fdb399ea1c36adcedddb034f88f81215e.webp)

# Matching Crankshaft Bearing Shells to Basic Bearing Journal of Crankshaft

![](images/e47283acb1cb8a4157dc5fbbe36664c4dc63f30423fb3d59c4a8941faf537398.webp)

![](images/77dca8d7f4f994bd2c2f1b0c5cc0f884114c66f486880cbb8f4fe89c91c549e4.webp)

# Selection of Upper Main Bearing Shell

![](images/6044e87fe49ca8b13a211da80184b086a082ec3690595c47a9ddcf7dacd61113.webp)

# Selection of Lower Main Bearing Shell

![](images/a545020a2897fc8cb3030d7f313a1bb4a12f483363e7e83935a60f006d8338e7.webp)

![](images/7f087bb9eed113a52725939ba3e545ed98e3059a9a50d17de299b670f1c71523.webp)

![](images/33c9a0f83ed677aa59a6b72d365edf61ec7d4e01ffda9c5fd5f0c8b820e3f377.webp)

# Crankshaft Position Sensor

![](images/fc3eb265991aadfd99cfc98813989bd1660be31cbf918034843708f1f30feceb.webp)

Y220_02098

The crankshaft position sensoris located near to flywheel on the rear of cylinder block. I generates AC voltage between increment type driven plate that fixed on flywheel inside. The sensor consists of soft ron core that winded copper wire on permanent magnet and generates sign wave AC voltage when magnetism on the sensor wheel passes the sensor.

When the crankshaft rotates, 't' signal willbe generated from near the front edge and 'signal wil be generated from near the rear edge among teeth on the driven plate near to crankshaft position. The AC voltage increases as the engine speed increases, however, no signal occurs from the 2-missing-tooth on the increment type driven plate. By using these teeth, ECU recognizes TDC of No. 1 and 5 cylinders.

ECU converts the alternative signals into digital signals to recognize crankshaft position, piston position and engine speed. The piston position that coupled with crankshaft is main factor in calculating injection timing. By analyzing the reference position and camshaft position sensor, can recognize No. 1 cylinder and calculate the crankshaft speed.

![](images/90e9d4ff90f0e0ae6b256655ab7c6d7242374934d92709da1e24ab7e9dbf63ae.webp)

Y220_02099

A. Distance between 't' max. voltage and -' max. voltage

a. Front edge b. Rear edge c. 2-missing-tooth

![](images/6276a43ac5181d49e2a8398dc58a0d3e8aa73a754cf79d74273751e153675ebc.webp)

![](images/54aec876b712298d894731df3ebe5f0e94cfd56a451878917fa8beb6d1d83cc0.webp)  
<Circuit diagram of crankshaft position sensor>

Y220_02100

![](images/2af34c8438586f7d7e6d85cebf4a5538c70db6b4f190df774361c9c55fa33886.webp)

![](images/f01c384ced94ccfdb3cceeb9627e4d130b4470b08c9cf1110279de974c2c0671.webp)

# TORSIONAL VIBRATION DAMPER

![](images/c8a4bf290d32e31e09e96917efebb2e9db939571e46a8619db220d620c1faf79.webp)

Y220_02101

# System Description

•Components: Hub, inertia mass, cover, bearing, bushing, silicon oil •Functions: The crankshaft pully optimizes the drive system by reducing the amount of torsional vibration in crankshaft. Conventional rubber damperi limited in changing materials (rubbers) to absorb vibration, but this crankshaft pulley (viscous damper), using silicon oil, takes advantage of less changing viscosity according to the temperature.

![](images/b40037c290e1c433d32ffc1fd03c5189f9b8fa7dc364e2e423b26d770a54e516.webp)

# Crankshaft  Disassembly

Unscrew the bolts and remove the connecting rod journal bearing and bearing caps.

# Notice

Position the #1 piston at TDC and remove the piston connecting rod journal bearing caps.

Remove the bearing cap bolts.   
Remove the bearing caps.

# Notice

•The crankshaft bearing caps are marked with stamped numbers. Start to remove from the crankshaft pulley side. •Do not mix up the bearing shells.

Remove the bearing caps and lower thrust bearing.

Separate the lower bearing shells from the bearing caps.

6Remove the crankshaft.

7Remove the upper thrust washers.   
8Remove the upper bearing shells from the crankcase.

# Notice

Do not mix up the bearing shells.

![](images/40c2c65507bbff23b6aa01732deb2758d4b3aa08edd11d9bf2a9ae4bd1ff1bed.webp)

![](images/46dbd1b9febc85efa7288744392837ab3b8fca10d2c759af29b84f3d012a6022.webp)

![](images/e9755fe4c1b9fb54294952e2e5c479110a35ff1a1158eb63a7c3b8c4aa08a9c8.webp)

![](images/da9dc9bed7987bff0fc52d2c8598842e0608a0bc4ce6ec4686b7498be43c3229.webp)

![](images/2287fe0c8037d3f632462be4069892b24750f8122a95813c826eeec8703f8120.webp)

![](images/0f76df851504f28be32088e8de7f887abf1d81ec87ee70433f3f2fe8c3c9fcc8.webp)

# Crankshaft  Reassembly

1 Thoroughly clean the oil galleries and check the journal section and bearings. Replace if necessary.

![](images/534d073d39d98925af464e119a8113192c1d60ecf9ca467487c33c80967f35fa.webp)

2.Coat the upper thrust washers with oil and insert into the crankcase so that the oil grooves are facing the crank webs (arrow).   
.Coat the lower thrust washers with oil and insert into the crankcase so that the oil grooves are facing the crank webs (arrow).

# Notice

The retaining lugs should be positioned in the grooves (arrow).

# Notice

If the maximum permissible length of L= 63.8 mm is exceeded, the 12-sided stretch bolts should be replaced.

![](images/374c3e80795bf80298a93f7d3ba1398695d3f3368ff09f64449ecdeea1af4ebc.webp)

![](images/c8dc2523f6b5cfca579e8095dda8b7bd75095904c16cc6a1db8847880ab8c380.webp)

4. Coat the new crankshaft with engine oil and place it on the crankcase.

5. Install the crankshaft bearing caps according to the markings and tighten the bolts.

![](images/a7ddb7279441458f8453ec30738eedf0b69c6e933caf78b5aeec80daf7855880.webp)

# Notice

Install from #1 cap.

6Position the #1 piston at TDC and install the crankshaft.

7. Install the piston connecting rod journal to the crankshaft journal and tighten the bolts.

8Measure the crankshaft bearing axial clearance. •When new: 0.100 \~ 0.245 mm • When used: 0.300 mm

9. Rotate the crankshaft by hand and check whether it rotates smoothly.

![](images/085c61338d755a0bb96a9efef6515424cfc628e12d4cca0c70586100e61e3895.webp)

![](images/2c0aec8057c6535675d33df338171ec6e353ff8f86bc47032dad0fd3ce9b8bff.webp)

# DUAL MASS FLYWHEEL (DMF, MANUAL TRANSMISSION EQUIPPED VEHICLE)

![](images/f00d87f933132b795420d986a14c1e545c96a9f4233a7716af5496ec1d240202.webp)

Y220_02111

# System Description

This flywheel is installed to the rear end of crankshaft and transfers the output from the engine to the power train mechanism. When starting the engine, this drive the crankshaft train mechanism initially by using the power from the start motor. Also, DMF measure the crankshaft speed, sends the signals to ECU, and controls the ignition timing.

![](images/3e1fe406e169407ff797c2d1cc2fbae0c20ebb66e7efb1f0c6da3ee6750441ec.webp)

Y220_02147

![](images/300705928d567fdb2e2bf11e14af5dd3c50f42e2cfe3c2a981f2081399fef416.webp)

# Function and characteristics

•When the output changes from the engine is high during power stroke (l): The damper absorbs the shocks to reduce the changes to transmission. • When the output changes from the engine is low during compression stroke (2): The damper increases the torque changes to clutch.

![](images/893d8ad8d86ba17d05f499c07e4e5756c502c42231676e57cfa58e4b2c50a6b9.webp)

# <Torque change curve of engine and drive shaft>

![](images/9b8efd386cfd673fce46bf4942e44f5042fd2ff0770e58a8399f0c0528fe889e.webp)

Y220_02113

# System Characteristics

Filters irregularities of engine: The secondary flywheel operates almost evenly so does not cause gear noises • The mass of the primary flywheel is less than conventional flywheel so the engine irregularity increases more (less pulsation absorbing effect) •Transmission protection function: Reduces the load to powertrain (transmission) by blocking the irregularity of engine

# Characteristics of DMF

Reduced vibration noise from the powertrain by blocking the torsional vibrations   
Enhanced vehicle silence and riding comforts: reduced engine torque changes   
•Reduced shifting shocks   
• Smooth acceleration and deceleration

# Advantages of DMF

•Improved torque response by using 3-stage type spring: Strengthens the torque response in all ranges (low, medium, and high speed) by applying respective spring constant at each range.   
•Stable revolution of the primary and secondary wheel by using planetary gear: Works as auxiliary damper against spring changes   
• Less heat generation due to no direct friction against spring surface: Plastic material is covered on the spring outer surface   
•Increased durability by using plastic bushing (extends the lifetime of grease)

![](images/178a6b9df013f33c1262e78ecabfcf246d6160f57d6b07a6672cdf03d34df264.webp)

# PISTON AND CONNECTING ROD

![](images/6814055d730ca63f65d70a22f3789670eb6cef9b9c5878494af1e48e7b7e1297.webp)

Y220_02114

1. Piston   
2. No.1 compression ring   
3. No.2 compression ring   
4. Oil ring   
5. Piston pin   
6. Snap ring

![](images/7469464e0b77c175eb92b0b14e6a840f87774a1589149fd9ab5f4b3d373044b4.webp)

![](images/533ab0278a180872285de733dd1364a7bba776ed486570d700100b2ed24f37c0.webp)

# PISTON RING

1.No.1 compression ring   
2. No.2 compression ring   
3. Oil ring   
5. Coil spring and oil control ring   
6. Hook spring

![](images/3b1fd3f21da4acb40d2ae30aafe44712baa7a753a93ab5738331dc05c9a47805.webp)

# Replacement of Piston Ring

•Measure piston ring end play.

- Piston ring end play (mm) 1st groove: 0.20 \~ 0.35 2nd groove: 0.20 \~ 0.35 3rd groove: 0.20 \~ 0.40   
-Clearance between piston ring and piston (mm) 1st compression ring: 0.075 \~ 0.119 2nd compression ring: 0.050 \~ 0.090 3rd oil ring: 0.030 \~ 0.070   
• Install the piston so that "Y" marking on piston head is facing in the direction of travel. Arrange the piston ring ends to be 120° apart.   
•Adjust the hook spring joint in the oil ring 180 ° away from the ring end.

![](images/94cb679dce92b9e6a7b533868fc739d7eeaf6efdff9734eff9777ac513dcc712.webp)

![](images/879ddcfe0858e61cac2939aab200a19f23cef911b1081553bea30061fadb1a85.webp)

# CYLINDER INNER DIAMETER AND PISTON SIZE

![](images/a1d569bfb97fcccb92be6b8428fe269f303589f4e023e41e55290826ab4eebea.webp)

Y220_02117

(Unit : mm)   
![](images/7800b7a26574cad1884d1d95d54a24dface26a91c7515b4ab206a196f7cf328a.webp)

![](images/88858c2dd4014f0da5d9babe5d68b8b8ffbdb63931cc9efbf73aa8e78c0d6a94.webp)

# Piston - Reassembly

1. Install the compression ring and oil ring on the piston with a special tool.

![](images/40e46e6b5c3e743fbed6409c75d1589b3ccdbda0f362f14aa17950145e76ab48.webp)

Arrange the piston ring ends to be 120° apart.

# Notice

•Install the No. 1 and No.2 pistons so that “Y” marking on piston head is facing upward.   
• No.1 piston ring is thicker than No.2 piston ring.   
•Arrange the oil ring end to opposite position of current ring end.   
• Oil ring is not directional.   
•Make sure that the piston ring end is not aligned to axial direction and lateral direction.

![](images/cd2b51fc5647da9ad647b53c0d3098952b198193e2d92f36bdd44c6171ff185b.webp)

Y220_02119

Check the clearance of piston oil ring and compression ring with a thickness gauge and adjust if necessary.

![](images/f89a9185e4bb1bbb44f33e4564694ac0bb39c5ad7a926a87b60f0cd2c7435827.webp)

\* Piston ring end play (mm) 1st groove: 11.0 mm 2nd groove: 10.5 mm 3rd groove: 7.0 mm

![](images/c185727fba2b33d71ea0160390a718e3c6a44c2aae798a1ac1effa6e81faddcb.webp)

3. Check the clearance of piston rings with a thickness gauge and adjust if necessary.

![](images/5fdc62e212dfd7a08a705169c83ba28abde04a777cfcf36d4a922582b663a1ce.webp)

![](images/21d67491fa5704a9b72c3f82682e8509cd760db9dfce67afc7ee0a0c9e9b7654.webp)

![](images/963e2e8dc80edf727093262caf258fe2a7f433d46d8670a097b2b9e92c46bb5f.webp)

![](images/45e7aba17d534c5e0a0579f18ee568c564ce7b79bf2d2c7561507afc44371f61.webp)

![](images/70c4e59fddfba6578422ed1a77a3e19d2e33e832bb185e7f8f69edd39620037d.webp)

![](images/2180da3cb4e994fb58f7caed9b8ed1496837ea7b3878e2410cbe2266a0b1333a.webp)

4. Fit the piston onto connecting rod so that the marking on piston crown and locking slot are facing to straight ahead direction.

# Notice

Install the piston so that the piston recess (marking) or the stamped surface of connecting rod is facing to straight ahead direction.

5 Lubricate piston pin and push in by hand.

Notice Do not heat up the piston.

Place new snap rings into the grooves.

# Notice

The snap rings should be replaced with new one.

7. Lubricate the cylinder bore, connecting rod bearing journals, connecting rod bearing shells and pistons.

Push piston into the cylinder with a wooden stick.

# Notice

The marking on the piston crown must be facing to straight ahead direction.

Insert connecting rod bearing shells.

# Notice

•The upper and lower connecting rod bearings have same appearance. Therefore, make sure to check the part number before replacing them. • Install bearing rod bearing cap so that so that the retaining lugs are on the same side of the connecting rod bearing.

10. Measure stretch shaft diameter of the connecting rod bolts.

![](images/f0578b811ec67db43151f733dd27101a5c1ca63cae4bf361f2209dfa2b4c7e2b.webp)

![](images/06f091ba118d5232b40596903902478e2e4821943f50a69295cefa850a9dc0e9.webp)

11. Lubricate the new connecting rod bolts and tighten.

![](images/8bab7ff720c00d4194e9fcd2c8d5094b973e681492bdf3d38405312d4a8bec22.webp)

• End play of connecting rod cap

![](images/148868dd08c096d5180bfcf19d66d5869374c45a76289ed60ef74f1dcab81f27.webp)

![](images/4bda262d3a0194205a36c06ffca1710c50e33df5bb99e4d5854e85d65710dbda.webp)

12. Position piston to TDC and measure the distance between piston and parting surface of crankcase.

![](images/d0fd2615eb0c83db0729358007d6f8193d371cb4fa85cbd2550b113510f5dcd4.webp)

•Measure at both ends of axial direction.

![](images/8083acdcbc3103d6e49c6208a926f98a49a614bf9edb087f5aa3c496f8393bf5.webp)

![](images/599ddc04b0bb886126c3f3c52b5ade8450d2f7617f59c09400f5248768c6de33.webp)

# Special Tools and Equipment

![](images/b58360bdaf747efe99a042887da226e875b7e500869218c96b4b0b2722a05cf0.webp)

![](images/f4e7310edd7c6f3cee25bfe4a28d27e31818ebf1bb35a7e65c1f479a570085a9.webp)

# HIGH PRESSURE PUMP (HPP)

![](images/fdb09b27e79d3d547d481f50e086395e03e469e18ce2bb0ab9ae63158c01c5a3.webp)

Y220_02133

1. Inlet Metering Valve (IMV)   
2. Hydraulic pressure head   
3. Plunger   
4. Drive shaft and cam ring   
5. Housing   
6. Roller and shoe   
7. Low pressure pump   
8. Fuel temperature sensor   
9. Venting   
10. High fuel pressure supply line   
11. Pressure regulator

![](images/20f29dd136e3b12c3141f06a608f91ba82d9ec619910dfc8ff5677cb2f4a08fd.webp)

![](images/f2f92448372755d98039c154b9c417e57cee2ca07e221c1384d00483b18acfd3.webp)

# HP Pump - Disassembly and Reassembly

Preceding works:

- Removal of fan belt (including cooling fan and fan clutch) and fan shroud   
- Removal of intake manifold assembly   
- Removal of water pump pulley   
- Removal of auto tensioner   
- Removal of EGR pipe   
- Removal of oil dipstic gauge

# Notice

•To prevent oil leaks, store the removed auto tensioner in upright position. •Be careful not to damage the rubber bellows. • Plug the oil ports for HP pump with sealing caps.

![](images/ab9ef33651ce59f80b9c290fc783764d4496b9a6f7463e1c1a0a83afcf182cc6.webp)

Set crankshaft pulley to OT point. Open the oil filler cap and check if the cam shaft notch marking is aligned to OT point.

Remove the cooling fan idle pulley with a pulley holder (special tool).

![](images/548899e9c4d3a0898badb15a4bde39be7a9cd170aa42caddf9cb2f9f35d82ade.webp)

Remove the cooling fan bracket assembly.

# Notice

Be careful not to get the sealant or foreign materials into the engine.

![](images/7615cabe5e27fb29551ae7fe199f21751d3271ee83e0c51c4a1da9b79b04fef3.webp)

4.Place the marks on the chain and HP pump sprocket for installation.

5. Remove the vacuum modulator bracket. 6. Remvoe the fuel pipes and wiring connectors which connected to fuel pump.

![](images/90b2c9f9fa308c1ba3fbd174f3e0dcd6d0efbda354844e37751d01ed4dba86f0.webp)

7. Turn the crankshaft pulley to the counter clockwise direction to ATDC 45° then remove the chain tensioner.

# Installation Notice

![](images/de09d92f2c0039044267d9d4c8a2317d3f0c3ff71f85a2a0fbca3f7e63a2e7d3.webp)

![](images/6197bd6cc8e9283899847611628b6ce8c356edd07b2e73dc3a392b5cb127b341.webp)

![](images/e4243917e8587d8429103d44b080c0e74a4286d1c5daf25b80dabf868e78d1a0.webp)

8While insert finger and push the chain guide backward direction and turn the crankshaft pulley to ATDC 65° by counter clockwise direction until feel the chain guide inclined backward.

9. Install a special tool into the cooling fan bracket hole to hold the sprocket.

![](images/0ae4ce8b301a73c546b7883914f899ed12ad3e52bb2e6237554d12c4cdcdb0b9.webp)

![](images/6cab9d9fd6f40a98fa2c178805304b1a2841b93fe64d9ba0654d43f32e312ef5.webp)

10. Remove the sprocket bolts and center nut and after slightly lifted up the chain, remove the pump sprocket.

# Installation Notice

![](images/a2ae790acd1dbd881567d306f57c7e12627581ca7298dce617118b8736c531ac.webp)

11. Remove the HP pump bearing with HP pump bearing puller (special tool).

# Notice

Do not apply excessive force. The timing chain may deviates.

12. Remove the HP pump mounting bracket.

Installation Notice

![](images/daedc4d69a3ee74748503c78fd701592eefe49403519c483b3bb822fcbc9ec54.webp)

13. Unscrew the external bolts and remove the HP pump while rocking and tapping it with a rubber hammer.

# Notice

•To prevent HP pump shaft damaging, do not apply excessive impact.   
•Do not apply excessive force. The timing chain may deviates.

![](images/98e2599b457381e285e072d18e9e1add7848a950a99a7cfcfeb27ee14deab997.webp)

14. Remove the HP pump.

15. Instal the new HP pump with sealing caps.

# Notice

Remove the sealing caps only when connecting the pipes and hoses.

16.When replaced the HP pump, initialize the fuel pressure by using SCAN-100. Refer to “Trouble Diagnosis” section in this manual.

![](images/3ed4d6aeb07e1f8af4cdfa89db6845a808632a85c488d0574e248a0b331e66fa.webp)

![](images/c0666c3fbc6ffdc20ac6fe2a683df282bddce22092ee2189c05d7f062f31bc3d.webp)

# Notice

If the initialization of fuel pressure has not been performed, the engine ECU controls new HP pump with the stored offset value. This may cause the poor engine output.

Install in the reverse order of removal and tighten the fasteners with the specified tightening torque.

1.HP pump sprocket   
2. 12-sided sprocket mounting bolt   
3. HP pump bearing housing   
4. HP pump (High Pressure Pump)   
5. HP pump shaft   
6. HP pump center nut   
7. HP pump outer bolt   
8.HP pump bearing shaft   
9. Oil gallery   
10. Bearing bushing   
11. Gasket

\* Tightening torque

![](images/daacc5d244a9037b0ec11212096ed00bc86fff1e10763ca98a6e6554e095f40a.webp)

![](images/673fefb3d857fd1cf972af19c95b7b5a030633b7cf56cae451baa020dea06f1f.webp)

# Table of Contents

AIR FLOWS DI03-3   
INTAKE SYSTEM LAYOUT . ... I34   
Components locator DI03-4   
Air cleaner.. DI03-5   
Air flow sensor   
(hot film air mass sensor) DI03-8   
Intercooler. DI03-14   
Intake manifold assembly DI03-16

SPECIAL TOOLS AND EQUIPMENT .. 317

![](images/0b1698b74abfe56d042a6f7d709391a18c43c97ce5c02458e3f7f1f8054697af.webp)

# AIR FLOWS

![](images/1e5226b8b4382787bd760e4cc07c1431ca4318af5f2f896285711af0b4818da9.webp)

# Work Flow of Intake System

Caer S Cargr Intercooler Maad Comuein

![](images/433d06c897ea6012cee41526b75cdfcac8f8fb1bbbe3dba203771396cf4eb44f.webp)

# INTAKE SYSTEM LAYOUT

![](images/58bdf5f478801d81b246ea8e5a1b2a09299f5dea0f2706153ebcdfda5d4d564d.webp)

# AIR CLEANER

![](images/bd43aa067592cd21ace04be63957efdd43c955b6b2cf87cf0ed237fc9d58a4a2.webp)

# Specifications

![](images/0f95d775e0efbe5897e1fab501ea6ebef44455949789b6c6029a4c95cfa17b2f.webp)

![](images/3260fc1b86d326d104678c2736ca7916031273e7b5367437a758918621e46966.webp)

![](images/79e610b7828a9ad1df6e3cad47c98a6c76844fe0f2236dc456b9ee47488a3ebc.webp)

![](images/fdf09d961d72f02b6aa86146fc07d4e5ed3ebb5ad04a7719ce765f7d39d8feda.webp)

# Air Cleaner Element - Replacement

Preceding Work: Disconnection of negative batery cable

1. Disconnect the HFM sensor connector.   
. Loosen the locking clamp and remove the intake duct.

3.Unscrew the screws and remove the air cleaner cover.

4. Remove the air cleaner element. Clean or replace the element as required.

![](images/47e3b44b41bade6b63ae8d8c20a9736120aa80aeb52e5260b62df390a09dc154.webp)

# Air Cleaner Housing - Removal and Installation

Preceding Work: Removal of air cleaner cover

1.Set aside the return hose and remove the coolant reservoir bolts.

Remove the air cleaner housing bolts.   
3 Install in the reverse order of removal.

![](images/9eec1a88b780c6daadc4a687f58dfbc45e15e16ceb379a5fb721c72e0fd00669.webp)

# Air Cleaner Housing/Element - Check

1. Check the air cleaner body, cover and packing for deformation, corrosion and damage. Check the air duct for damage.

3.Check the air cleaner element for clogging, contamination and damage. If the element is partially clogged, remove the dust or foreign materials with the compressed air. If the contamination is severe, replace it with new one. Also, be careful not to contaminate during the replacement.   
4.Check the air cleaner housing for clogging, contamination and damage.   
5. If the inside of housing is contaminated, remove the contaminants.

# Notice

When cleaning the air cleaner with compressed air, direct the air from inside (engine) to outside (ambient air). Otherwise, contaminants can get into the engine.

![](images/8ec4041afe3e5c28222d5ad84cea65f43702f23c1e7583e0fdfbcfa1dfbf2fac.webp)

![](images/6e647f63165990f20fd3378b70490a2b86e57b258568b7148d68c3aac2e367fe.webp)

# AIR FLOW SENSOR (HOT FILM AIR MASS SENSOR)

inner tube added + grid (No.3) added + sensing chip changed + sensing section design changed

![](images/da39e8a71832c3b119f11568b24bf02427c42438362a76d61210bac98a19a40e.webp)

![](images/09a8be99cba965289b43107bedf337a9520d21dd1f78c1ca8f8b39c98c2c7b12.webp)

# Results

Durability has enhanced 60 times (lab test results)

<CI type HFM sensor structure>

Y220_03011

1. Plug-in sensor   
2. Cylinder housing   
3. Protection grid   
4. Hybrid cover   
5. Measuring duct cover   
6. Housing   
7. Hybrid   
8.Sensor   
9. Mounting plate   
10. O-ring   
11. Temperature sensor

Air flow sensor is locating on the air intake passage between air cleaner and intake manifold and measures air volume flows to engine combustion chamber and intake air temperature.

And intake temperature sensor built-in the sensor detects intake temperature.

Internal circuit of the air flow sensor is being used to control the voltage value to control the temperature to maintain the heating resistance (Rh) to 160°C that is higher temperature than intake air temperature that is measured by resistance (RI).

emperature sensor of the heating resistance (Rh) is measured by resistance (Rs).

Iftemperature changes occur due to increasing/decreasing intake air volume, voltage of the heating resistance change to maintain the intake air temperature changes to set value (160°C).

Control unit computes intake air volume based on voltage changes of heating resistance.   
Intake air temperature is measured by NTC integrated in the sensor.

![](images/383eda78bb6aefa0eb78cf57ddc333656f99deea524410bb9f01bf96f7f6effb.webp)

Intake air temperature sensor is a part of HFM sensor and a thermister and resister and detects air temperature changes that flow into the engine. There occurs high resistance when temperature is low and low resistance when high (NTC type).

ECU supplies 5 V to intake air temperature sensor and then measures voltage changes to determine the intake air emperature. When air in the intake manifold is cold, the voltage is high and air is hot, the voltage is low.

The reason for using HFM sensor is that this sensor is most proper in controlig accurate airfuel ratio to meet the legal emission regulations. This sensor measures actual intake air massinto engine very accurately during specific instant acceleration and deceleration, and determines engine loads and detects intake air pulsation and air flows.

Main functions of HFM sensor are:

• Using for EGR feedback control   
•Using for turbocharger booster pressure control valve control   
• Using for fuel injecting compensation

CI type HFM sensor: The air flowing the sensor does not directs toward sensing section but flows along with lower wall after passing protection grid to enhance durability of the sensor. Oil, water and dust less damage the sensor.

![](images/336d4f9d4029ebe7b2d7ab7a43db960fe71c6c28fa9f403eb95082eefd2ea3fe.webp)

![](images/e1aa41b3838d355a892e6e8c54928870bc2151381065cd8bcd207ca43c3c5ee7.webp)

![](images/30f1dbb949090cc93695c860372b64e1c6de3c6a14405fdbbfd720e2c9aba57c.webp)

Y220_03013

![](images/3ef7a6fa980c2cea86a6750627e864cc0ea65baff52efe8879a0e7db0b100523.webp)

# HFM Sensor - Removal and Installation

![](images/8719616015360f63310babe02117779fc9bfe44931dc7a3f42023f3199ad1cd5.webp)

Preceding Work: Disconnection of negative battery cable

Disconnect the negative battery cable. 2. Loosen the clamps on the air cleaner and the turbo charger and remove the duct.

Unscrew the bolts and remove the HFM sensor assembly.

![](images/a0bde4584a45af1f3790f915f5edcdfd53c179f3e06fac8acb0acca379bd32bd.webp)

![](images/5f59833cff57e73e69ea1ccb88ea4ec6c114b57e3f21a5d9c6c06531002523b2.webp)

![](images/29b8dd85a1d337c6d9dc1fa3e7524581dbc2301585fe5b24e3772f399d3227c4.webp)

![](images/ab088188eafda4c9caf79a4df855b43e98b2adc228e41de8d103a373cf1696a9.webp)

![](images/1e1984a1cef81a82f4580ab9f3a7beea62993364a2a8f96a7231c5fa293cf6db.webp)

![](images/d2e03837d1b053f9023c2b3eeacfeb64459f1d883b61ab511891253f53a536c7.webp)

4 Install in the reverse order of removal.

# Intake Air Outlet Hose (Turbo Charger) - Removal and Installation

Remove the radiator grille.

2. Loosen the clamp at both sides and remove the outlet hose.

3.Loosen the clamp on the intake air hose and remove the intake air hose.

Installation Notice

![](images/fd4f77b88ddc992a51a0668b684b215ccc68f9dfbc413c5fa958944545985fcb.webp)

Install in the reverse order of removal.

# Notice

Securely fasten the clamps on the pipes and hoses.

# Intake Air Inlet Duct (Air Cleaner) - Removal and Installation

1. Loosen the clamp at intercooler side.   
2 Loosen the clamp at turbo charger side.

![](images/0dd1634768d090ace55770184665af755d2e53ab600bf6b54ad0289419fd9169.webp)

3.Separate the hose from the oil separator and remove the intake duct. 4 Install in the reverse order of removal.

# Intake Air Inlet Duct (Intake Manifold) - Removal and Installation

1. Loosen the clamp on the inlet hose in intercooler.

![](images/1dd94eef57e35457cc99ad7525b302be8de6175328abe503da0df4a549f56b84.webp)

2. Loosen the clamp at the intake manifold and remove the inlet hose.

Installation Notice

![](images/4e49e08f65f85133ccee852dc6b50896b7d1559d2470dff27c15bf60b8293feb.webp)

3 Install n the reverse order of removal.

![](images/8ae67cb206c1873fcd87cfe5a1af7893501e02c7266e410526bd9708ca5e3f17.webp)

# INTERCOOLER

The turbo chargeris designed to improve the engine power by introducing more air (oxygen) into the engine. However, the intake ai is heated (100 \~ 110°) during the compression processin turbo charger compressor and the density is lowered.

The intercooler is the device which cools (50 \~ 60°C the air entering the engine. Colder air has more oxygen molecule: than warm air. Thus cooler air gives more power and better fuel economy.

![](images/5cba1edd6fa402d070768a7eaf80886c358d91aa02b86df20da0cd61375d81e6.webp)

1. Intercooler

![](images/597065e5b705751c4a26a8bf83b56a501f3ead85c85bbe89058823f5cbb50aae.webp)

# Intercooler - Removal and Installation

Remove the radiator grille.

![](images/e38a371c87227c253a927958ab9c711f67ef7e78082e8a3fcc67334606b519d6.webp)

2. Loosen the clamp at both sides (inlet and outlet) of the intercooler.

# Installation Notice

![](images/6a906243580c7501bd2d7c148958dd859e14252133e959647334c4e574b4a313.webp)

3Remove the intercooler mounting bolts. Installation Notice

![](images/223e6516afa47a1f94e742e34481ba7785c8dc2db9652cde3abf385f6c6fc550.webp)

![](images/278d26f9edf094fcba4b6b44a5cbc682d434751e2e51960a950e6af0c9e431fc.webp)

4.Remove the air duct in intake manifold and the intercooler assembly.

5 Install in the reverse order of removal.

![](images/ac161e74188586fcb117d24052c3a2118ef17cbfb185ad69d0bb13890f34e771.webp)

# INTAKE MANIFOLD ASSEMBLY

![](images/04ea9c8324727d67966b2768913153c658ad5cf9222b231c54bfe4c13c7076bc.webp)

Y220_03030

# System Characteristics

•Shape that delivers the required capacity of compressed air from turbo charger to inlet port   
•Optimized EGR gas mixture in inlet chamber   
•Maximized intake efficiency with helical and tangential inlet port -Improving the swirl ratio in low and mid operating range -Improving the acceleration/fuel economy and reducing the maintenance in low and mid operating range   
Integrated inlet port and coolant outlet port

![](images/ef40143ac1677d359bbeeea3cdd128d536b201387926e95d42a78751571b4a66.webp)

# SPECIAL TOOLS AND EQUIPMENT

![](images/498f20c6933431f5e818fce8fe98244732f6ab33a7b187c1c810236613784518.webp)

![](images/f61b625423ff25bd190eaedbe75952695651a0da5451912efaeebd9bbfb23b07.webp)

![](images/c7a9811d9aab201f28db633a955fb0a3d44cb659ac7ae0e3773354b2d5a736b4.webp)

![](images/b465ef91d01af14e3d5ddb55bcf2a0034486be95196928800f18c87bbf4f4478.webp)

# Intake Manifold - Removal/nstallation

Preceding Work: Disconnection of negative battery cable Lift up the vehicle and remove the skid plate.

![](images/27aaf3e1df42067ffbccf14b1039a23be7b90de3d8c469ea334e7f6596cba72d.webp)

2. Open the coolant reservoir cap and remove loosen the drain cock to drain the coolant.

3.Remove the air inlet hose (1) from intake manifold.   
4.Loosen the clamp and remove the coolant inlet hose (2).

Remove the coolant inlet port housing.   
6Remove the vacuum hose from EGR valve.   
7. Remove the EGR valve mounting bolts and gasket. Remove the EGR exhaust pipe (primary) mounting bolts and gasket.

# Notice

•Replace the pipes (2, 3) at both sides of EGR cooler (1) and gaskets with new ones.   
•Make sure that the convex surface of gasket is facing to the pressurized direction.

Remove the brackets and connectors from top section of the engine.

-Vacuum hose bracket in turbo charger   
-Booster pressure sensor   
-Main wiring bracket   
-Ground cable bracket   
-Fuel pressure sensor connector

9. Unscrew the bolts and remove the vacuum modulator bracket.

![](images/265621880be6549689cea98103536a06b2a83f1005e3452bb91df9102bf8f1ea.webp)

10Remove the HP pump fuel supply line bolts.

11. Remove the HP pump fuel supply line mounting bracket.

12. Remove the HP pump fuel return line at fuel filter.

# Notice

• Plug the openings of pipes and ports with sealing caps to keep the cleanness of the fuel system. • Replace the pipes with new one once removed.

13.Remove the injector return line at HP pump.

# Notice

•Be careful not to damage the pipes to HP pump. • Plug the fuel return port of the HP pump with a sealing cap.

![](images/93094dc661adfabf2653bed1e2e066b14125da444923ca6ad474a682679c72ba.webp)

![](images/a1f332cf175571a98e40da62734fb5506b3f6bbfaa105512b173e683f5726e2b.webp)

![](images/fcf4b4db9097f08c9457caded56b9c6837c157ac6fa6794143d75163e73369a0.webp)

![](images/62a5ae6fcc58a2d6a977cdef17fba700adcd5155fc4ef274f777f43de112deea.webp)

14.Remove the intake manifold mounting bolts.

# Notice

Check the length of the bolts before installation. M8 x 45: 6EA M8 x 130: 6EA

![](images/9113a0dbbc6c69014ea2ebfeffd7de89fbee99c7736f64390067de2faed4619e.webp)

15. Lift up the vehicle and remove the propeller shaft joint bolts.

16. Unscrew the bolt in oil filter and remove the intake manifold and gasket.

# Notice

•Replace the gasket with new one. • Make sure that the residual coolant in intake manifold gets into the inside of inlet port.

17. Instal n the reverse order of removal.

# Notice

•Replace the gasket with new one. • If replaced only gasket without any other service operation, completely remove the coolant and other contaminants from the engine before installation.

![](images/f0b8553e189d3105d1c58af73750b7b92f57e88c4ae3f87c8c6806340c94e897.webp)

# EXHAUST SYSTEM LAYOUT ... .. 43

Components locator DI04-3   
Exhaust gas flows . DI04-4   
Turbo charger assembly. DI04-6

# EGR VALVE AND VACUUM MODULATOR .. DMI04-27

EGR system. . DI04-27 EGR valve and turbo charger actuator control vacuum circuit . .DI04-28

# EXHAUSTSYSTEM AND .MUFLER . MI4-36

Muffler .. .DI04-36   
System overview . .DI04-37

![](images/ca2708aca29c9f55b69c23dfc25816686881b2045b27d00a50d558674e94547c.webp)

# EXHAUST SYSTEM LAYOUT

![](images/a541d682fb8db79243708ff34effedca078f32ae8b42a134992546627b8f56e1.webp)

![](images/9a30a84acc364e89a01404e8997fc5f8b1f9e5dd922cedc81d5edd86f897902b.webp)

# EXHAUST GAS FLOWS

![](images/aed865a541e00c3bc351a99804707b4d38f4b21b450c18d49b3dc1ea78bd0b64.webp)

![](images/4e49f3be77e2f80cfbe60d26fe203a88b784c5191324221ae5eaa7558935f68f.webp)

# Exhaust Manifold Removal and Installation

Remove the two intake hoses from the turbo charger.

![](images/73449aec5c26e3060111cd271abdd915f73ec41790e28e3cb5b2680ba42d7cda.webp)

2. Remove the turbo charger assembly (refer to Turbo Charger section).

![](images/83d1f0164f2a832503c765d98ab822ed99b1ccc2d71c367a4701e01bd72238cd.webp)

3. Remove the #3 pipe of EGR valve from the exhaust manifold.

# Notice

The #3 pipe of EGR valve is exposed to the high temperature and pressure of exhaust gas. Replace the gasket and pipe with new ones. Otherwise, it may cause the leakage of exhaust gas.

![](images/8f0e618accbe56646883f3d4138065e0cf7a24debbceef402bc528e15b7ad6cb.webp)

![](images/ce2fde512cc324e5a7c6f828816e725287c9169af58ef1e193b827919a453ff2.webp)

4.Unscrew the nuts and remove the exhaust manifold and gasket.

![](images/fa09a0a4258000c09a57bee32734c8d84ce09afdaa18cf70a9c287dab15c522b.webp)

# Replace the gasket with new one.

5 Install in the reverse order of removal.

![](images/6f9e5370cab8d929128d7873475306713613981404cf84caa16d0c2aa89f6532.webp)

![](images/fd407ab6f9d7d18d340061af9be455c6e39d0e1ec9a97d8eaf7dc29a325f53c8.webp)

# TURBO CHARGER ASSEMBLY

The turbo charger is an air pump installd on the intake manifold. It enhances power and increases torque power of engine to increase the fuel consumption rate. The engine without turbo charger cannot get as much power output as it inducts air by the means of vacuum being generated from descending strokes of the piston. Therefore, by installing the turbo charger on the intake manifold, it supplies great amounts of air to the cylinder increasing the volume efficiency and, subsequently, enhances output power.

Also, as the engine's power enhances, it increases the torque power and improves the fuel consumption rate. The regular turbo charger operates by utilizing the pressure from the exhaust gas and the other, caled Super Charger, operates by utilizing power from the engine. When the turbo charger is installed, weight of the engine increases by 10 to 15 % whereas the output power increases by 35 to 45 %.

![](images/94629866bc671c84771215775e2224aed4fc76d0fc6111c966e1df9fcfc6b1a7.webp)

Y220_04007

# Operating Principle of Turbo Charger

![](images/17a9fe0a394efdb0c6cfcad5c7a5e2ebaec0bfff198f3a04467750f8814007b2.webp)

The turbo charger has one shaft where at each ends are installed with two turbines having different angles to connect one end of housing to the intake manifold and the other end to the exhaust manifold. As the turbine, at exhaust end, is rotated by exhaust gas pressure the impeller, at intake end, gets rotated to send air around center of the impeller, being circumferentially accelerated by the centrifugal force, into the diffuser.

The air, which has been introduced to the diffuser having a passage with big surface, transforms its speed energy into the pressure energy while being supplied to the cylinder improving the volume efficiency. Also, the exhaust efficiency improves as the exhaust turbine rotates. The turbo charger is often referred to as the exhaust turbine turbo charger.

Diffuser: With the meaning of spreading out it is a device that transforms fluid's speed energy into the pressure energy by enlarging the fluid's passage to slow down the flow.

![](images/b607508f7578305b4c76dd458d9d61bb9f67d2dc09ee1cc9db9baf373c169b67.webp)

# Construction of Turbo Charger

The turbine wheelin turbo charger and compressor wheel are installed at each side of the shaft. I is comprised with the shaft supporting center housing (supporting the compressor with two float journal bearings), the turbine side parts of Turbine Wheel, Shroud and Turbine Housing, and the compressor side parts of compressor wheel, back plate and compressor housing.

The turbine rotates turbine wheel by receiving exhaust gas energy from the engine.   
The compressor receives torque energy from the turbine and the compressor wheel inducts air t force it inside of the cylinder.

![](images/468bf2e7ddbcdb311d331d714f852c6c55d50dd39106225db1164cfa8c75b704.webp)

Y220_04009

1.Turbine housing   
2. Turbine wheel   
3. Compressor housing   
4. Compressor wheel   
5. Center housing   
6. Turbo charger booster pressure control valve   
7. Control link   
8. Bypass flap

A. Air inlet (from atmosphere)   
B. Exhaust gas inlet (from cylinder)   
D. Exhaust gas outlet (to atmosphere)   
E. Exhaust gas bypass passage   
Н. Oil supply opening   
J. Oil return line

![](images/fa94c3220b9a2f1464ea0e2acc7d7d541222c81102090a0a6c7db1caa353fc7b.webp)

![](images/f8ba3efeb7c5ca2c6db8f051578043ad2e6142703686ef8893c393724135b8f7.webp)

# Impeller

The impeller is wings (wheel) installed on the intake end and performs the role of pressurizing air into the cylinder.

The radial type has the impeller plate arranged in straight line at the center of shaft and, compared to the backward type, is being widely used as it is simple, easy to manufacture and appropriate for high speed rotation. As the impeller rotates in the housing with the diffuser installed in it, the air receives centrifugal force to be accelerated in the direction of housing's outer circumference and flows into the diffuser.

As surface of the passage increases, air flown into the diffuser transforms its speed energy into pressure energy and flows into the intake manifold where the pressurized air is supplied to cylinder each time the intake valve of cylinder opens up. Therefore, the efficiency of compressor is determined by the impeller and diffuser.

# Turbine

The turbine is wings installed at the exhaust end where, by the pressure of exhaust gas, i rotates the compressor and performs the role of transforming heat energy of exhaust gas into torque energy. The radial type is used as the turbine's wings. Therefore, during operation of the engine, the turbine receives temperature of exhaust gas and it rotates in high speed, it requires to have sufficient rigidity and heat resisting property.

During operation of the engine, exhaust gas discharged through the exhaust valve of each cylinder makes turbine rotate by coming in contact with the turbine's wings from the outer circumference within housing of the turbine and is exhausted through the exhaust manifold. At the same time, as the impeller is on the same shaft, it rotates.

# Floating Bearing

Floating Bearing is a bearing, which supports the turbine shaft that rotates at about 10,000 to 15,000rpm. I could be rotated freely between the housing and the shaft as it gets lubricated by oil being supplied from the engine.

# Notice

Stopping the engine immediately after driving at high speed stops oil from being supplied to the bearing and may cause it to get burnt. Therefore, the engine must be stopped after cooling the turbo system by sufficiently idling the engine.

![](images/897b87eaf93c15b0fb8562c2e6a4bb530f865b1f99b9acc4c9bd2c2eaf4fa277.webp)

# Booster Pressure Control Valve Unit (Turbo Charger Actuator)

In order to reduce discharging of hazardous exhaust gas and to avoid the engine's overrun the turbo charger must be appropriately controlled. The maximum turbo charging pressure must be controlled as excessive increase in the pressure and power output can cause critical damages to the engine. In order to control these, the booster pressure control valve is installed on the turbo charger.

The difference of the booster pressure control between the existing D engine and D engine isthatiD engine, booster pressure of the intake manifold operates the booster pressure control valve connected directly to the turbo charger whereas in Dl engine, the control is achieved by utilizing vacuum modulator (vacuum from a vacuum pump) designed to control the booster pressure control valve. It operates booster pressure control valve by supplying electrical power to the vacuum modulator having the amount of air being flown into the HFM sensor from the engine's ECU as the base signal.

Refer to the EGR section in following pages for the function ofturbo charger and HFM sensor in exhaust system.

# Booster pressure control valve unit and vacuum modulator

![](images/fa4e4970c4c6af011bb10de9b04c9d70890313e00e49e6cbd70d6fc53d8b9941.webp)

Y220_04012

![](images/29eb9bc514caf319a45b8aefae1b570edb1dc10b5793ce4b1aff5375e3024327.webp)

# Diagnosis and Maintenance for Turbo Charger System

The following lists cautions to take during test drive and on the turbo charger vehicle, which must be considered during the operation;

1. It's important not to drastically increase the engine rpm starting the engine. It could make rotation at excessive speed even before the journal bearing is lubricated and when the turbo charger rotates in poor oil supply condition, it could cause damage of bearing seizure within few seconds.   
If the engine is running radically after replacing the engine oil or oil filter brings poor oil supply condition. To avoid this, it's necessary to start off after idling the engine for about 1 minute allowing oil to circulate to the turbo charger after the replacement.   
3When the engine is stopped abruptly after driving at high speed, the turbo charger continues to rotate in condition where the oil pressure is at '0'. In such condition, an oil film between the journal bearing and the housing shaft journal section gets broken and this causes abrasion of the journal bearing due to the rapid contact. The repeat of such condition significantly reduces life of the turbo charger. Therefore, the engine should be stopped possibly in the idle condition.

# Notice

After string for long period of time during winter season or in the low temperature condition where the fluidity of engine oil declines, the engine, before being started, should be cranked to circulate oil and must drive after checking the oil pressure is in normal condition by idling the engine for few minutes.

When problem occurs with the turbo charger, it could cause engine power decline, excessive discharge of exhaust gas, outbreak of abnormal noise and excessive consumption of oil.

1. Inspection when installed

-Check the bolts and nuts foe looseness or missing   
- Check the intake and exhaust manifold for looseness or damage   
- Check the oil supply pipe and drain pipe for damages   
-Check the housing for crack and deterioration

Inspection of turbine in turbo charger

Remove the exhaust pipe at the opening of the turbine and check, with a lamp, the existence of interference of housing and wheel, oil leakage and contamination (at blade edge) of foreign materials.

-Interference: In case where the oil leak sign exists, even the small traces of interferences on the turbine wheel mean, most of times, that abrasion has occurred on the journal bearing. Must inspect after overhauling the turbo charger.   
-  Oil Leakage: Followings are the reasons for oil leakage condition; •Problems in engine: In case where the oil is smeared on inner wall section of the exhaust gas opening. •Problems in turbo charger: In case where the oil is smeared on only at the exhaust gas outlet section.

# Notice

Idling for long period of time can cause oil leakage to the turbine side due to low pressure of exhaust gas and the rotation speed of turbine wheel. Please note this is not a turbo charger problem.

![](images/9b965f9651184e3bfd3677a5d0670e551b4dc950601f9b58aab497c0395ca5bc.webp)

- Oil Drain Pipe Defect

In case where oil flow from the turbo charger sensor housing to the crank case is not smooth would become the reason for leakage as oil builds up within the center housing. Also, oil thickens (sludge) at high temperature and becomes the indirect reason of wheel hub section. In such case, clogging and damage of the oil drain pipe and the pressure of blow-by gas within the crank case must be inspected.

- Damages from Foreign Materials When the foreign materials get into the system, it could induce inner damage as rotating balance of the turbo charger gets out of alignment.

# Inspection of Turbine

Thoroughly check the followings.

# Must absolutely not operate the turbo charger with the compressor outlet and inlet opened as it could damage the turbo charger or be hazardous during inspection.

- Interference: In case where is trace of interference or smallest damage on the compressor wheel means, most of times, that abrasion has occurred on the journal bearing. Must inspect after the overhaul.

- Oil Leakage: The reason for oil leakage at the compressor section is the air cleaner, clogged by substances such as dust, causes the compressor inlet negative pressure;

A. Rotating in high speed at no-load for extended period of time can cause oil leakage to the compressor section as oil pressure within the center housing gets higher than pressure within the compressor housing. B. Overuse of engine break (especially in low gear) in down hill makes significantly low exhaust gas energy compared to the time where great amount of air is required during idling conditions of the engine. Therefore, amount of air in the compressor inlet increases but the turbo charge pressure is not high, which makes negative pressure at the compressor section causing the oil leakage within the center housing.

# Notice

No problem will occur with the turbo charger if above conditions are found in early stage but oil leaked over long period of time will solidify at each section causing to breakout secondary defects.

- Damages by foreign materials: In case where the compressor wheel is damaged by foreign materials requires having an overhaul. At this time, it's necessary to check whether the foreign materials have contaminated intake/exhaust manifold or inside of engine.

![](images/7df9fb284c21007d47d87d6d9687a7a5127448b79c766dd988a16c6c9a3f6c15.webp)

# Path of Turbo Charger Defect

The following tries to understand the defects that can occur with vehicle installed with the turbo charger and to manage the reasons of such defects.

1. In case where oil pan/oil pipe has been contaminated, oil filter is defected and where adhesive of gaskets has been contaminated into the oil line.

![](images/7e07c11bc3dff943cc645c416c51bcace77041ef63655d92f9b29c881d06dafd.webp)

![](images/aa38f4e71dd6243f662f25d91d78d4c3089d9ed48530f8ab7637530954364c5b.webp)

. Oil Pump Defect: Rapid over-loaded driving after replacing oil filter and oil and clogging of oil line.

![](images/169fc97e8ffa59f4ab9e7ab780f978a95b74f5f2a02cd310a9198240716a6921.webp)

![](images/69f4601e5195509e6f5d1c8f5c82ee377078cee1c31bb3066f87fe5e02ff1271.webp)

# 3. Turbine Side: Inflow of foreign materials from engine Compressor Side: such as air filter, muffler and nut

![](images/69bcd87b23f29dcbdae2a081c9816ddc293cce121451d41e2bd81e4f7afbe8f6.webp)

![](images/9eb15d104e6748e63d56bd0aba272b0f562dade33205e6fab13142525aa313f2.webp)

![](images/44ca2667aac06bf278d23e0edade6fa9704b198b5ab1d3157df2d0f17dae0085.webp)

![](images/8673d36cdda438962db1d39d553994699fb933ba90fb410f7ebff424ff01a5e9.webp)

# How to Diagnose

The followings are cautions to take in handling defects of turbo charger, which must be fully aware of;

# Cautions When Examining the Defects:

After stopping the engine, check whether the bolts on pipe connecting section are lose as well as the connecting condition of vacuum port and modulator, which is connected to the actuator.

During idling of the engine, check for leakage in the connecting section of pipe (hoses and pipes, duct connections, after the turbo charger) by applying soap water. The leakage condition in the engine block and turbine housing opening can be determined by the occurrence of abnormal noise of exhaust.

.By running the engine at idle speed, abnormal vibration and noise can be checked. Immediately stop the engine when abnormal vibration and noise is detected and make thorough inspection whether the turbo charger shaft wheel has any damages as well as checking the condition of connections between pipes.

.In case where the noise of engine is louder than usual, there is possility of dampness in the areas related with air cleaner and engine or engine block and turbo charger. And it could affect the smooth supply of engine oil and discharge. 5. Check for damp condition in exhaust gas when there is sign of thermal discoloration or discharge of carbon in connecting area of the duct.

When the engine rotates or in case where there is change in noise level, check for clogging of air cleaner or ai cleaner duct or if there is any significant amount of dust in the compressor housing.

7.During the inspection of center housing, inspect inside of the housing by removing the oil drain pipe to check for sludge generation and its attachment condition at shaft area or turbine side.

Inspect or replace the air cleaner when the compressor wheel is damaged by inflow of foreign materials

Inspect both side of the turbo charger wheel after removing inlet and outlet pipe of the turbo charger.

-Is the rotation smooth when the rotor is rotated by hand?   
-Is the movement of bearing normal?   
-Inspect whether there has been any signs of interference between two wheels.

# Notice

It's important not to drive the engine when the intake manifold hose has been removed.

![](images/51b5c639fa98edf800971f331eb01a29375c523764ca663dac8484c1b691d58c.webp)

# Diagnosis and Measure

![](images/b5bef5cbfa41ebb608b57df5b8204b7dd6c35fc2a8773593d9572d8cfe751387.webp)

![](images/20f4745ad50628196b8c539100e660b65c9cbf64ec862ed07b5db9b78fdf7d9c.webp)

# Before Diagnosis

The base of making diagnosis on the EGR related system is the inspection on the connections of the vacuum hoses in related system as the first priority. When abnormal condition occurs with the EGR system, the basic approach is, as described in prior sentence, making detail inspections of vacuum circuits of each system before connecting the scan tool or vacuum tester. I is necessary to manually check on the connections if there are any slacks orloose circuits even if the visual inspection shows vacuum hose as being connected. f there are not any problems then the next inspection area is the connections of the system connectors. Most problems with the occurence of system malfunction are from conditions of vacuum line and connector connections and the causes from the malfunction of mechanical mechanism is actually very few.

For example, when there are no problems with basic components, let's assume that there is a vehicle having vacuum leak from connection slack in the vacuum line between EGR vacuum modulator and EGR valve. This vehicle, due to the driving condition or, according to the circumstances, smog or other conditions, could create customer's complaint and by connecting the scanning device could display as the malfunction of the EGR valve's potentiometer.

As previously explained, this car has a separate controller to control the Hoover EGR and, in accordance with various input element, the controlle controls EGR valve by regulatig the force of vacuum being applied t the EGR valve through PWM control. At this time, the controlle has to receive feedback whether the EGR valve operates correctly according to the value sent t the EGR modulator and this role is performed by the EGR potentiometer located at top section of the EGR valve.

In other word, the controller sent correct output value to the EGR vacuum modulator but, due to the leakage of vacuum, signal of required value can not be received from the EGR potentiometer causing to display as malfunction of related parts.

As a reference, the EGR valve of diesel vehicle (DI Engine) controling from the engine ECU to EGR system has different shape than the Hoover EGR valve because the EGR valve's operation signal n the DI engine is performed by the HFM sensor instead of the EGR potentiometer.

This principle is that when the EGR valve opens up to flow exhaust gas into the intake unit the amount of fresh air, comparatively, wil be reduced. The DI engine ECU receives feedback signal of change in amount of air being passed through the HFM sensor according to the opening amount of the EGR valve.

![](images/04a5969d05428aa625565ffe207f4a3dfdeceb5bb66f41bc506fd2c868c7eebd.webp)  
Hoover EGR System for IDI Engine (Including the EGR Valve Potentiometer)   
EGR System for DI Engine

Y220_04013

![](images/10b03f03117430fbee77a87d5eb9d54b339a94d785353e6611a0ae908635f75f.webp)

The other big diffrence between the Hoover EGR and EGR controller for Dl engine is that from two vacuum modulator, one is same as being the modulator for EGR valve whereas the Hoover EGR system's the other modulator controls ALDA of injection pump and the DI engine's the other modulator controls waist gate ofthe turbo charger.

This difference is in accordance with the difference in fuel injection method where the IDI engine has mechanical njection system and Dl engine is capable of making electronically controlled fuel injection.

In other word, t reduce the amount of the fuel injection in no-load rapid acceleration mode, the IDl engine's Hoover EGR utilizes solenoid valve to disconnect the connection circuit between intake manifold and ALDA causing negative pressure to occur in the vacuum modulator to reduce the amount of fuel injection. When Dl engine, basing input signal from the related sensors such as acceleration pedal sensor and engine RPM, recognizes that current mode isthe no-load rapid acceleration mode it reduces the amount of fuel injection by sending short electrical signal to the injector.Therefore, disregarding the modulator for the EGR valve in DI engine, one must keep in mind that the other modulator is used to control the booster pressure valve in turbo charger.

![](images/77a9a4b787e24c1f454561c99708fd34f7aa4050d5237ca05ff712f429ffa0cf.webp)

![](images/3ee26763517dc231f041b300223d861aea7769473c6181398a92e77bb6f4b00b.webp)

![](images/d37ad4052c64c4bc2a9c9191563e98b65415c7dd009f4cab3142372364b7da3b.webp)

![](images/dd982b23a251ef469d1f9dd45a1ac7973a5af6b57b4855207e2d70c4e934872d.webp)

![](images/678f6861ef047674cd372bc523618cd4877d7bbc37da102bf2739809c6b99987.webp)

![](images/58532306a6234e15240e75f08a52d8844e830a546f59e062db7fc784df34cce9.webp)

![](images/4f9b32962ef78264b0db7c4c985d4e972008c4efa617437c74ff0315fa8a0abd.webp)

![](images/4ad902619c4fbbb7706cd57d26ea8f8d0ff801e7a7f8edce15eacc270ef016b4.webp)

![](images/0dcdf89837bcba1c5b8ab4a0fe9772d67f27fa6a95c1a630d38b30413e911083.webp)

![](images/94d85a4fe9ad105edb545300ef7c90b30e7b532107c5f1eb0550d86f9c48ae20.webp)  
For other diagnosis, refer to Diagnosis section.

![](images/6b3aa24994dd10469f5686e3eff44b4eb2530e3e4166e9f36b463dea924d4833.webp)

# Turbo Charger Assembly - Removal and Installation

Remove the drain plug and drain the engine oil from the oil pan.

Installation Notice

![](images/c939a49e8b65f0184046a2a318746081b2b3f6c6de3b8a66864690cbe8ad4528.webp)

Remove the vacuum hose and inlet hose from the turbo charger.

Installation Notice   
![](images/af6b58e2f93696f368cefebc900d361493346485bdbe01142eb28d06d41c9550.webp)

![](images/8b1d6390cab0d84dc79aa83042ceccc84bfc82f4574a0b33770c32fbb681e3f5.webp)

3. Remove the bolts and nuts at the exhaust manifold in turbo charger.

# Installation Notice

![](images/e155a159b5d3ecf2f7295bd75f23b1b1db0674cdd7d72bc52dbbe498674919a5.webp)

4.Remove the lower and upper bolts at turbo charger oil supply pipe.

Installation Notice

![](images/77d1232a3f305ca6f75bc93c740c6af9b66a7ab715201a24572e0f9e91e3f4eb.webp)

![](images/cf1f3097a156f942db61a7b95e410efdf9268785a3111db6b1852d21a26db79d.webp)

![](images/7964908c27aa1827e155f4abe97cc01a02c2777d0d3b420f522c8b44346016d6.webp)

![](images/371f277a4299fb37d83420820220dc035b684ccf107143205caec562acc3919c.webp)

![](images/ce8742312c5557816f5606fbe019d2565d81cb5ebf6815c4cc5199c397fb2f87.webp)

Remove the lower bolts at turbo charger oil return pipe.

# Notice

Replace the steel gasket with new one.

Installation Notice

![](images/320a848c707e946df8a39387a0dad5b2e8163f2c80761f9388dfff117b1959a0.webp)

![](images/a28f922e3b2b9e08c140a78e5c66a2d10158b1a1820c6e59ebde004c1ad21f23.webp)

Remove the lower bolt at turbo charger bracket.

7.Remove the turbo charger bracket bolts. Installation Notice

![](images/fed67c8663c1728adef447cf42ddee15b3631ec3396c4d27615426d583aa9627.webp)

# Notice

Use only 12 1/2" wrench.

Remove the bolts and nuts at the turbo charger and the exhaust manifold.

Installation Notice

![](images/2fff0e97558d55535e69999a4498c2d20ae302a641fb60a0455b871d01af6b44.webp)

Remove the turbo charger assembly.

10. Install in the reverse order of removal.

# Notice

•Replace the steel gasket with new one. •To prevent gas leaks, tighten the fasteners with the specified tightening torques.

# EGR VALVE AND VACUUM MODULATOR

EGR system controls the opening vale of EGR valve by transmiting electrical signal (PWM control) from the engine ECU to vacuum modulator. Also, the engine ECU receives the feedback signals of the amount of air flowing through the HFM sensor.

![](images/729fee833873cc365bf7553010a8a6349d91becccc3f36ab541498d579598248.webp)

Y220_04023

1. EGR valve

2. Vacuum modulator

3. Vacuum pump

4. EGR center pipe (EGR cooler)   
5. Intake manifold   
6. Hfm sensor

![](images/17ff6565fa7de874bc7c7aa8fce540d8fae572679528a7a66f2fa5ed07a4e84e.webp)

# EGR VALVE AND TURBO CHARGER ACTUATOR CONTROL VACUUMCIRCUIT

The biggest diference between the vacuum circuit and layout of the Hoover EGR system after K2004 has been introduced is the location of the vacuum modulator for EGR valve control and the function of the other modulator. In case of EGR equipped veicle (ID ngine), it performs the role of controlling the PLA of ijection pump whereas, in D engine, it controls the turbo charger actuator.

# DI engine vacuum modulator

1. EGR valve vacuum modulator   
2. Turbo charger booster vacuum modulator

![](images/6b4aa807773f58c27b2de8c24228dbc893564939697827c48a96308bb67b6489.webp)

# IDI engine vacuum modulator (hoover EGR system - K2004)

![](images/45efaf5ea456cb2cd07e9dcea3c20cd1f33b080f36a48a1c95cb32cf185cd508.webp)  
1. Vacuum modulator for EGR valve control

2. Vacuum modulator for injection pump PLA control

![](images/6082986f3b594a4dd5d984453c95f58ef551c419f9d1e0f3e8f0d4ea64771c47.webp)

# Vacuum Modulator and Vacuum Hose

Below figures illustrate vacuum hoses and related parts of EGR or turbo where wrong or poor connection of vacuum hose would display condition of engine irregularity and defect diagnostic codes on the scan tool.

# Related with EGR valve

![](images/c00d416754cc22e577d75037d3b80a2ef1844a3d6c353665f050263fd806c2fe.webp)

Y220_04026

# Related with turbo charger actuator

![](images/f35d17cec2607e421a00638a254a1f010d9c49d3923225b332d6867d397ebc98.webp)

Y220_04027

![](images/f5f5c1256addae7d92ea5ba20fa260659692242460ae06fcb99b65f618acd150.webp)

# EGR System Diagram

![](images/5a7eb53f8b5a8216f760cc881cf9bbe8ccc7ef35c79780274245d1c5ee8fa27b.webp)

Y220_04028

# EGR Valve

EGR valve recirculates some of exhaust gases to intake system to reduce toxic NOx from engine according to ECU signals.

• EGR valve opening point : -270 mmHg

# EGR Modulator

According to ECU signals, the vacuum modulator drives EGR valve by contrling vacuum pressure that is generated by vacuum pump with PWM type controls.

![](images/1f4194017efea05ed66e0f0e45baf6e215e8aab114a25702becad4eae5f0b557.webp)

# Operation Principle of Vacuum Modulator

![](images/7dfe87fc6100a7ad54d657ec45faa71e9b6e1f4e5681c8d7a452edfe563590b0.webp)

Vacuum is controlled according to relationship between chamber pressure (l in rolling nipple cover and magnetic force (l) in plunger.

According to ECU signals, the solenoid valve controls the vacuum pressure that is generated by vacuum pump (-900 ± 20 mbar) with PWM type control and drives the mechanical EGR valve and turbo charger.

![](images/a89c6da348c30f4f008533c1ecb40b0d1e60901ebb5aa3e469e00867a1e41f73.webp)

# Operating principle: Balance between original vacuum pressure and magnetic force (see above figure)

•Normal state (Fig. A): Original vacuum and seat section, 3 stoppers keep sealing   
•Duty up state (Fig. B): Original vacuum pressure is connected to inside of diaphragm chamber   
Duty down state (Fig. C): Increased diaphragm chamber pressure is connected to atmosphere to compensate the pressure.

![](images/4cda7e41bc689cb741dcf7f4d9eac94739d719a7c6f9b8299f1e3ad1bceb3769.webp)

> Operating principles when duty is applied from 0 to 50 %

Vacuum consumption: Compared to 50 % of duty, ON/OFF periods are most unstable and vacuum consumption is most high.

![](images/01935f2fd97fefb08d08aca9a4e9c4e0e24f69c933a0397a478eb1913791a07e.webp)

# Output Characteristics

![](images/c074ac8cf0bfca7634fa29e24eefbb34229d73b74d821db3850d924bab48e184.webp)

![](images/6ce8331abd63512d6aa697ba95932a20b2a64bca7c9983b9cec137ccbeaa4933.webp)

# Operating Conditions

Engine is running   
•Engine RPM is within a specified range. (EGR OFF under high RPM range)   
Engine torque is within a specified range. (EGR OFF under high torque range)   
•Vehicle speed is within a specified range. (EGR OFF under high speed range)   
Atmospheric pressure is within a specified range. (EGR OFF under high altitude and low atmospheric pressure) •Coolant temperature is within a specified range. (EGR OFF under high or low temperature)   
EGR OFF under extended period ofidling.

# Control Logic

•Main map: EGR volume is controlled based on intake air volume   
•Auxiliary map - Coolant temperature (Coolant temperature sensor) -Engine rpm (Crankshaft position sensor) Engine load (TPS): Detection of sharp acceleration - Intake air temperature (HFM): Decreases when over 60°C -Atmospheric pressure (Barometric sensor): Compensation of altitude

• Compensation value of auxiliary map willbe increased/decreased based on main map then ECU calculates EGF volume finall to regulate the vacuum duty that applies to the vacuum modulator to control EGR valve openings.

# Shut-off Conditions

Engine rpm: over 2,950 rpm   
•Vehicle speed: over 105 km/h   
• Coolant temperature: over 100°C or below 10°C   
•Idle period: over 50 seconds

![](images/c9820d0ae81cb4de4e133741457fc4acadf313949f549e8485089d83562ccce2.webp)

![](images/ee0c0dd728e54490954c311c4a97af20ec8ba9f791245a931ac523d30c213725.webp)

# EGR Valve and Pipe Removal and Installation

Remove the vacuum hose from the EGR valve.

![](images/abfdc7dc560a5fdabd606388992cbe4b4f7d3d14629ba712d02a16a602bd9dcb.webp)

Unscrew the bolts and remove the EGR valve (2), EGR valve #1 pipe (1) and gasket.

![](images/5e385ce553e2796a8a4cd08aa23f2f95319f783e11874bc3920441cd285b3698.webp)

3. Remove the EGR valve #1 pipe, #2 pipe, #3 pipe and gaskets from the engine.

![](images/caefd2999a8c41978a761c8b4d888000e691047e340eba7d4f86bf254cc08797.webp)

![](images/7c91fe18ccf6cb9d934cad95a4219bffd248b87ff38019e52678cb708094f9ac.webp)

![](images/7739f0f164303cd076436d75d962a4b1bf488e77931f8eb33e69803437cb7fa9.webp)

4 Install in the reverse order of removal.

# Notice

•Make sure to observe the specified tightening torques.   
•Never reuse the EGR #1 pipe (intake) and #3 pipe (exhaust) once removed.   
•Replace the gaskets with new ones.

# Vacuum Modulator - Removal and Installation

1. Remove the vacuum hose from the vacuum modulator.

Remove the vacuum modulator from the bracket.

![](images/c0d131e9eba1db2e4224d6531186b43e5a1fff73286f0dd7134e7f5229154f53.webp)

3 Install in the reverse order of removal.

# Notice

Make sure that the vacuum hoses are connected to correct locations.

![](images/3f76e0c20b0c3a6c3df63aa66302b1bbcfefce163045fdbeb5e26f57f4a4145f.webp)

![](images/e5b5ac22c9bb638e6af78151412e4ddb8d21aa7c55acb6ca2b44d2474720d1e6.webp)

# EXHAUST SYSTEM AND MUFFLER

![](images/48bec8351fb6b3a738553328277fc08b68cd5b881208b87785e2c13d9306f18c.webp)

Y220_04039

# MUFFLER

The mufler is located at the middle of the exhaust pipe and reduces the pulse noise and the tail pipe noise by eliminatig :he flowing resistance from the exhaust gas.

The important elements of the muffler are volume, construction and location.

![](images/19997ac7e155acc0a38edc4ebd15964de8814c73b9ad9e9f14f7435fa5069a02.webp)

# SYSTEM OVERVIEW

Check the complete exhaust system and the nearby body areas and trunk lid for broken, damaged, missing or mispositioned parts, open seams, holes, loose connections, or other deterioration which could permit exhaust fumes to seep into the trunk may be an indication of a problem in one of these areas. Any defects should be corrected immediately.

# Notice

When you are inspecting or replacing exhaust system components, make sure there is adequate clearance from all points on the underbody to avoid possible overheating of the floor panel and possible damage to the passenger compartment insulation and trim materials.

# DOC (Diesel Oxidation Catalyst)

DOC (Diesel Oxidation Catalyst) is the purification device to reduce the toxic emissions from the exhaust gas from the engine. By using the chemical reaction, the amount of toxic gas such as NOx can be reduced.

# Notice

To prevent damage of DOC, never contact the lift pad when lifting up the vehicle.

# Muffler

Aside from the exhaust manifold connection, the exhaust system uses a flange and seal joint design rather than a slip joint coupling design with clamp and U-bolts. If hole, open seams, or any deterioration is discovered upon inspection of the front muffler and pipe assembly, the complete assembly should be replace, the complete assembly should be replaced. The same procedure is applicable to the rear muffler assembly. Heat shields for the front and rear muffler assembly and catalytic converter protect the vehicle and the environment from the high temperatures that the exhaust system develops.

# Heat Shield

The heat shield protects the vehicle and components from the high heat generated from the exhaust system.

In this vehicle, the heat shield to block the heat from DOC is installed to the underbody, and the heat shield to block the heat from the rear muffler is installed to the underbody between the fuel tank and the rear muffler.

# Hanger

The hanger is to support the components.

If the ganger is not properly installed, it may cause the vibration that is very difficult to diagnose. Therefore, install the hanger to the correct location so that the exhaust system cannot contact to the underbody and other components.

![](images/12ed49668614230542fe4f5d192ee44a539b3c7e8a9aad8ea56cc6b5733ff272.webp)

# DOC (Diesel Oxidation Catalyst)

Oxidation catalytic technology for diesel engine is basically the same with it of gasoline engine used before development of 3 primary catalyst (2 primary catalyst), and its effect and performance were already proved.

DOC (Diesel Oxidation Catalyst) reduces HO and CO contained exhaust gas over 80 %, and removes SOF (Soluble Organic Fraction) over 50 \~ 80 %, but because its portion in total PM is low, it reduces approx, 20 \~ 40 % of TPM (Total Particulate Material).

Because of low reducing rate for PM of DOC, in order to guarantee safety rate of PM regulation, this technology is being used mainly. And it should keep over 80% of PM reducing rate, and at present it plays a role as a transition stage.

And also it reduces diesel odor and black smoke, platinum or palladium are being used as a catalyst.

On the other hand, it is a problem that it makes the reaction of oxidation, which SO2 produce SO3 and H2 SO4 by reacting to oxygen in exhaust gas, if temperature of exhaust gas becomes over 300°C, and this produced gas is very harmful to human body. To prevent is, previously it is requested that the sulfur content rate of fuel should be below 0.05 %, and in the future it is being expected to keep it below 0.01 %.

# Catalytic converter structure

The Catalytic converter of monolith type consists of 2 walled metal bodies which is made of Cordierite.

The principal element of converter consists of the materials like Alumina or oxidized Serume in order to apply to Ceramic Monolith. Washer coat operates first, and catalytic metal elements (Pt, Pd, Ph) operates to washer coat next.

Monolith type is lighter than other types, easy to manufacture and quickly approaches to proper temperature.

Washer coat is used to make a contact surface with exhaust gas bigger by adhering closely to small holes of inner layer.

If a lead compound or phosphorus adheres to the surface and the temperature rises, its surface is decreased.

The total area of general monolith converter is about 45,000 \~ 500,000 ft3. (10 times of a football field)

Generally Alumina (AL2O3) is used as a raw material and its 7 phases of gamma, delta, theta have big areas and high stability for the temperature, and nowadays gamma Alumina is used usually.

![](images/05658c7466dcc56703aaf0e7facd4be302b372929a6fb78a2b4c8f39c8809659.webp)

![](images/179f879262b64ef613ef8c1b137d9d015017067f81921e4c1e447b2f60643cec.webp)

# Catalytic converter and temperature

Catalytic converter has the normal function of purification at a range of the temperature. Because it has a weak point of decreasing of the purification rate in the condition of continuous high temperature, it should keep the temperature range of 400 to 500°C for normal condition. HC purification rate becomes better according to the increase of temperature in the normal range of temperature. CO purification rate becomes the best near the temperature of 450°C, and NOx does so near the temperature of 400 to 500°C.

# Purification of catalytic converter

•Adhesion of soluble organic fraction (SOF) below 180°C   
Purification of soluble organic fraction (SOF) over 180°C Chemical reaction formula   
•SOF(HC) + 02 .02+ H20   
•2C0+ 02. .2C02   
2C2H6 +702. .4CO2+ 6H20

![](images/08f30ee524bac08561219291c4977626b1be9b0eb8ec5b0e4d2227f7368eb4e2.webp)

![](images/7bab70b91543681e4d8b579228c3f03e2996641a2172ccf83bfcf3a6c5d78c67.webp)

Y220_04042

•Oxygen adheres to catalytic material : below 180°C

![](images/e13673ff1eb0ba3c0c819d0a051d6068fba9849bf1c9980d989ecb70f004bae0.webp)

Y220_04043

![](images/ce1ed1caf09a992b9d00a8528b311ae59a88b07c2fec2d2c00e5abc0b39da338.webp)

![](images/e81953582709e0a8f7cb8b34a9598b622c31438565149efa8ff631379194242b.webp)

C2H2n+2 .PAH (Aromatic HC) Soot Soot Metals SO2+H20 Metals SO2+H20 Catalyzer CO + 1/2 O2 CO2 HC + O2 CO2 + H20 PAH + O2 CO2+ H20 Aldehydes + 02 CO2+ H20 Y220_04045 • Catalytic material supplies each CO and HC with O2 for their oxidation : above 180°C

• Catalytic material conversion process by DOC

# Method for reduction of NOx

NOx is generated a great deal in case that combustion temperature and excess air factor are high. EGR valve can decrease NOx (30 to 35 % decrease) by making temperature of combustion chamber fall by means of exhaust gas recirculation.

![](images/08552229e198e8ed6c9c9aa1de8c260836cb41e7cd46838e63708ee4758cb77e.webp)

# #1 Exhaust Pipe Removal and Installation

1.Remove the upper bolts at turbo charger.

# Notice

Use the universal type wrench.

![](images/b4524ed86fbff1107870b380510bee39c74007df9db9352d4e24a2592c8b36f7.webp)

Remove the lower bolts and gasket.

![](images/83252dfae5f2a2ec8cb13ab2c87a499f25420ccae746e821cdab9f3e62342c48.webp)

Remove the pipe mounting rubber.

![](images/0872ad5c225e28202929cb706bafd891045c23eb24eb5c7f921006cad4d52efe.webp)

4.Remove the #1 exhaust pipe.   
5 Install in the reverse order of removal.

![](images/6d4119476e578fb50c6008397b95989ce9cbc8dac033f18c434e7447e1dd76d2.webp)

![](images/b31d78ae1c41d8d67fc342d7052424dee744a4c00c2932815af72f7a7eb25931.webp)

# Catalytic Converter Removal and Installation

Unscrew the bolts at both sides and remove the gasket and the converter. Install in the reverse order of removal.

![](images/ee95eb51f08b86f80bb5652cf41c23fb5c90a283b9817c7ac8ff66e1af8c32fd.webp)

# #2 Exhaust Pipe Removal and Installation

Unscrew the bolts and remove the gasket.

![](images/c2b33f62c972c63a01d2ee3d24fd5cfcfbda7effc8fdd61d0ecc8a17fa5557ca.webp)

Release the rear mounting lever with a screwdriver.

![](images/da4f166b91da4a026c9d503bd8fe628f121dcf056c8236b28375e1cfd97d2293.webp)

Remove the #2 exhaust pipe.

![](images/9d1341c262b477336d99b6aea7c440540dabe105545f8e61681f628c4184210b.webp)

4Install in the reverse order of removal.

# LUBRICATION SYSTEM. .. ... 0-3

Lubrication system layout . DI05-4   
Lubrication diagram . DI05-5   
Specifications . DI05-6   
Engine oil change DI05-10   
Oil pump . DI05-14   
Oil spray nozzle . DI05-16   
Oil pan assembly DI05-17

TROUBLE DIAGNOSIS ... ... I18

SPECIAL TOOLS AND EQUIPMENT . . 5.19

![](images/3742e3b4aca8c6770b097894ac473c304d00462bce85fdee33bb856c01d7a1b5.webp)

# LUBRICATION SYSTEM

![](images/fd6144d57d8fd25b47297498736c3d446d35d61a4ca95bb48ea9da4d1b77412b.webp)

![](images/efd95c59f468a2c5d618fe894cce2b7223520c43504851a4c268efd5e6294c16.webp)

# LUBRICATION SYSTEM LAYOUT

![](images/fa7a4f6551b4011c06f9ea3782e2cb5b7aaaffcf993491653996302d455c9d25.webp)

Y220_05002

![](images/1c9a3870e9c857ff9e453ab59f40c88a5ddb95914edc77a7950fc491263b139c.webp)

# LUBRICATION DIAGRAM

![](images/ac577ba71a798d0f963dbcd6aa2dd8b2cbfb4b95f5df31c87cb9d1037b78d876.webp)

Y220_05003

1. Opening pressure of by-pass valve in oil filter: 3 ± 0.4 bar

To prevent instant oil shortage after stopping the engine, the return check valve is installed in oil supply line of cylinder head.

![](images/f1fbbbd087837cf4ec48b4e4be22ffde6ac91dbce59599bab7b5b0b0f5ac434a.webp)

# SPECIFICATIONS

![](images/3b8722e8d89889c69b12c9677d14868e21be8e894355ff3ffc569701cadba066.webp)

# Severe condition:

-When most trips include extended idling and/or frequent low-speed operation as in stop-and-go traffic. -When most trips are lessthan 6 km (Operating when outside temperatures remain below freezing and when most trips are less than 16 km)   
-When operating in dusty, sandy and salty areas   
- In hilly or moutainous terrain   
-When doing frequent trailer towing

![](images/074d89a01432d818188d8f83fb4e5d83d75cd296e6f47a2ca2df379c77311b33.webp)

# Oil Pressure Switch

• Operating temperature: -40 \~ 140°C • Operating pressure: 0.3 \~ 0.55 bar •Permissible pressure: 10 bar

![](images/fc32662436819aa5e73f9dfe27c0829422c2a9d46669f79de6a49d209313605e.webp)

# Oil Pump

![](images/d353f0adddeaee13000ca46a0c65e729626d2fb8fb5c69a6123d19df719be7fe.webp)

![](images/d33cd2b8d3a7a31dc221f624e7b9761a96ed2e6e1c69a40db6019cf5d9a9d6ed.webp)

Differences between D27DT and old model (D29ST) - Enlarged pump capacity: Width of tooth (pump gear): 33 mm (D29ST: 30 mm) -Increased number of teeth (sprocket): 26 (D29ST: 24)

# Oil Cooler

![](images/90ebd4b130c0b835b3aa970110e9bd7ea3afa62d2dd7c7d36d0b7025b023b1eb.webp)

•Replace two oil cooler gaskets with new ones when the oil cooler has been removed.

![](images/039dee6b26aed205a94943b60ab35b81ef04c288a828355fa67d3a6a9fffcf9e.webp)

![](images/f70f30163ca03ce08c0c65a5372aa580603087052a113b44b2c489a53d1f77b5.webp)

# Blow-by Gas Reduction Device

![](images/37d180c6d283a8bf1f141316c790f4ae52107ea6211e1d17b4d2f7cdf7a13946.webp)

# Cylinder Head Cover

![](images/59392498a16edd98f32d3f6ef990354750ee533a7c124d2a39e71ce5f08b6c7e.webp)

Bafleplate assembly: The bafle plates in cylinder head cover separates oil and gas from blow-by gas, and controls the blow-by gas speed to send only gas to separator.

![](images/54606e97579f7ee743de662d86874a2d06a2ede7f0fd5bee0b5d902349763845.webp)

# Oil Separator

![](images/ba05ca503a139174692c94970192bbef4d103c0d4c4baeabf3145a444ae55282.webp)

Y220_05009

The first separation wil happen when blow-by gas passes through bafle plates in cylinder head cover; then oil and gas will be separated due to cyclone effect after entering the oil separator inet port. Separated oil returns to oil pan via oil drain port and the gas wilbe burnt again after entering the combustion chamber through air duct hose via PCV valve that opens/closes due to pressure differences between the intake side and crankcase.

# Engine Oil Pressure Check

Check the oil level and quality before checking the oil pressure.

Drain the engine oil.

Disconnect the oil pressure switch connector and remove the switch.

. Install the oil pressure gauge into the switch hole. Start the engine and let it run until the coolant temperature reaches at normal operating temperature (80 \~ 90°C).

Raise the engine speed by 2000 rpm and measure the engine oil pressure.

![](images/9e1313de15ca998c6d5955ac13846319583e3ae4a824f1ba6c420622f08b2230.webp)

Install the switch and engage the connector.

# •Apply the Loctite onto the thread of the switch and check for oil leaks.

![](images/0bd458c58556a4686e1ab4c4ab92fc288cc9f28d98e53329ea0a9e312236e308.webp)

![](images/2c2b203b22c22cfd4e961fd2703c6a816a1e01b96e6ac87fb9b0e91dd159d544.webp)

# ENGINE OIL CHANGE

Change interval: Initial change: 5,000 km, Change every 10,000 km or 12 months

Frequently check and add if needed. Shorten the change interval under severe conditions.

\* Severe condition:   
- When most trips include extended idling and/or frequent low-speed operation as in stop-and-go trafic. - When most trips are less than 6 km (Operating when outside temperatures remain below freezing and when most trips are less than 16 km)   
- When operating in dusty, sandy and salty areas   
- In hilly or moutainous terrain   
- When doing frequent trailer towing

# Water separation from the fuel filter should be performed when changing the engine oil.

![](images/521f955aeb4260231fd6fd3f4d4dd7971dad86a46fc23c1d29e610412a9739ea.webp)

# Engine Oil Changing Procedures

1. Park the vehicle on the level ground and warm up the engine until it reaches normal operating temperature. Stop the engine and wait around 5 minutes. Remove the oil filler cap, oil filter and oil drain plug to drain the oil.

# After driving, the engine oil temperature may be high enough to burn you. Wait until the oil is cooled down.

3Install new oil filter and tighten the drain plug with specified tighten torque.

![](images/87e8ab949544d61ef0a07c5657ceb24544966f93f768c3fead9a8890699bd039.webp)

# Notice

•Over-tightening may cause oil leaks.   
•Replace the drain plug washer with new one.

Fil te engine oil through the oil filer opening.

# Notice

The oil should not go above the upper mark on the dipstick. This would lead, for example, to increased oil consumption, fouling of the spark plugs and excessive formation of carbon residue.

Close the oil filler cap and start the engine.   
Stop the engine again and check the oil level. Add the engine oil i needed and check for the oil leaks.

![](images/8d488bc8459e8b14ed813db6fa9584a7b1d9390a65239d2fe7487a5c43471c27.webp)

# Engine oil filter change

1. For changing procedures, refer to the “Lubrication System” section in this manual.

• Lubricate the engine oil gasket with engine oil before installation.   
•Tighten it with the specified tightening torque.

![](images/dc87db5193445f6e3228b7d03b5bdd566e19867d000fa4050da7392552eaf917.webp)

![](images/80ce8bbc405c8c0545c63ef48cb527a0e012a45db192374d1ba8f6a30fcfd51b.webp)

Y220_05011

![](images/a3bfac9b4720c556210a860e837fbc4c33448d96a9c2629d8654ff48cee83fb2.webp)

![](images/075e792f3ebf5d3246ea45af9198d4fb8389e810f42a0d656ae06fa418d1a35a.webp)

![](images/a80bd6dd94d6336615ea9e41c7727fa6811fb52885ee4a284c179f48c31f40c8.webp)

# Oil Filter and Cooler Removal and Installation

Preceding Works:

-Draining of engine oil -Removal of EGR vacuum modulator bracket

.Remove the oil cooler hoses (supply and return lines).

Disconnect the ground cable from the oil pressure switch.

Remove the oil cooler and filter mounting bolt.

# Pay attention to the length of bolts.

![](images/73b5b29b3ecb96cd4e55005c6ed58109ef4245cada122f70147ccb8ce78b2176.webp)

4Remove the oil cooler and filter assembly from the cylinder block.

# Notice

The oil cooler and filter assembly cannot be replaced separately.

5 Install in the reverse order of removal.

![](images/cd6bd7f216e603860800f8506174a663685ec99197d39fd545920c0d9a1d922f.webp)

![](images/053c1fc0e14ebac0ba7d7f3897131550d9852f303a8614fd74987f607c0c02a0.webp)

# OIL PUMP

![](images/7f63368c02d4afa88c03e0f22d37209a5611542c9466450a69c995dc1fbfaa68.webp)

1. Oil pump   
2. Plunger   
3. Compression spring   
4. Guide pin   
5. Screw plug 50 Nm   
6. Combination bolt . 23 ± 2.3 Nm   
7. Oil strainer

![](images/0ad480bb15077466609718184c5ecc375f09700f6a6ea4cc6ff12f167142be87.webp)

# Oil Pump - Removal and Installation

Remove the oil pan.

![](images/d55a7c457c95ee785fd8e5bbb1ed94963c57812159b2a138dedd5a0a0140499e.webp)

Remove the oil pump.   
3Remove the screw plugs and the relief valve.   
4 Install in the reverse order of removal.   
5. Start the engine and check for oil leaks.

![](images/b23caa5c28f7e68189baa4d0def3eaf32debac17413aff3b027a2d055f28c29b.webp)

# Oil Dipstick Guide Tube Removal and Installation

Pull out the engine oil dipstick.

Remove the EGR valve pipe (No.3).

![](images/d003df32401c5f87f1fcd3aeaf3725d94925546637fb6af8539d5d3ac0af87fc.webp)

# Replace the pipe with new one.

![](images/fa21c4655b7abd490bd66138bb08f2c37e294dda3d80b4e4a894892ebe9f2159.webp)

Unscrew the bolt and remove the oil dipstick guide tube.

# Replace the O-ring with new one.

4 Install in the reverse order of removal.

![](images/3ef02304cd11c58cc183635ffefa5b8e8423d0ea062ea8e97fe95718191cdb20.webp)

# Notice

After installation, check for oil leaks.

![](images/99091a806062b9c6aebc3e8b1988a15e58c038959dfd7ddecfc328f5cab6f6e7.webp)

# OIL SPRAY NOZZLE

![](images/baffd58b3a601c970cdd214250557c1be66335b5be38c597189e8e2ac9a140e2.webp)

Y220_05021

1. Fitting sleeve   
2. Oil spray nozzle

3. Combination bolt . .10 Nm

4. Oil duct

![](images/d3b815b3a0f0396c991636c90eb6b6659b8dc5f9856c5d25ad782a7e710f28c0.webp)

# Disassembly

1. Remove the oil pan or crankshaft.   
2. Unscrew the bolts and remove the nozzle.

![](images/ebb4c16aea9a3b9231476b5f172b2045486372b0216789b1ea2c8169db519746.webp)

# OIL PAN ASSEMBLY

![](images/56678c4c66265bb294004d2cb3f1f3918ab78f089743faad9da546daf5de71a0.webp)

Y220_05023

1. Oil pump   
9. Oil pump cover   
10. Bolt   
32. Drain plug   
33. Drain plug . .25 ± 2.5 Nm(replace the washer)   
35. Spring pin   
36. Oil pump drive shaft   
37. Oil pump driven shaft   
38. Oil pump relief valve piston   
39. Spring   
40. Oil pump relief valve pin   
41. Oil pump relief valve plug   
44. Bolt .. .10 Nm   
45. Washer   
46. Bolt   
49. Oil pump roller chain   
50. Oil pump chain lock link   
51. Oil pump chain tensioner   
52. Oil pump chain spring   
53. Bush   
56. Oil pump sprocket   
57. Bolt   
58. Dust cover   
59. Cylindrical pin

![](images/3c18d2b5ff769cbff959e5ab6f2b40f7e821919582d89ce91a8ebe4bd8ff69ae.webp)

![](images/9f8f81553fe4807be640095312a9c8936226d6874379625cf8d42cea01583d93.webp)

![](images/7ecad4a0443d112cc94cc58cdda311cd4c1ab460c98884ecb054c81d18bf17e3.webp)

![](images/9029c217e14e492f6e603ea52c7c2baedebf8215cedd5671f7fc66425cf1cae4.webp)

# SPECIAL TOOLS AND EQUIPMENT

![](images/7b1f1c2f94723bdcebf17e79432782c8e2a1648ab9ab6f537a83f031f32bc146.webp)

![](images/8e84d967651dfaf8375eb6aa973cd99e5d9cab9eb5066e17ab8eaaa8112265f4.webp)

![](images/7adbf6cc858f12cd93fd1728f34ac71c22b3dc8e1afc0d7f7140bff3744fd997.webp)

# Table of Contents

COOLING SYSTEM .DI06-3   
ENGINE COOLING SYSTEM. .DI06-4   
Specifications . DI06-10   
INSPECTION AND REPAIR DI06-14   
Inspection . DI06-14   
REMOVAL AND INSTALLATION DI06-16   
PREHEATING SYSTEM .DI06-29   
Overview DI06-30   
Preheating relay DI06-30   
Preheating system diagram .. DI06-31

![](images/040c11a09427eda2c4bbe3bc45deddc12513df5d91f558cec0280684e1a89e4d.webp)

![](images/4c1f166eb28373d1a6cd5a77417910ec97694ab7f29a00d5b965033fa383c5e9.webp)

FFH (Fuel Fired Heater): refer to “FFH System” in this manual.

![](images/4506e7c3c2128979f11f6b6e632430ec5f1a491d4694ef231bb3a16972a1b65a.webp)

# ENGINE COOLING SYSTEM

![](images/6a24e061d96bc39093da0703cf466d64036d02f280d584b3d24a75cda0083eb4.webp)

Y220_06002

Cylinder block side Block #5 → Oil cooler → Heater → Heater water pump inlet pipe → Water pump   
Cylinder head side Cylinder head → Coolant outlet port (intake #1) → Radiator → Water pump

![](images/b8fec26e5201f557b92dfce33d55517f5f434dd72429ca0da3a4b8e792695327.webp)

# Function Description

![](images/fb62d6569ac6cf2d65fa8d93f36fd048290ca74813566a3946abeaf2f61a8f7d.webp)

•Cylinder head coolant outlet port is integrated into intake manifold. (in front of cylinder #1) Improved shape and gasket material to prevent coolant from leaking

![](images/06f7e8a9feef88d388fc2be67984aeb75e64daa6f08245c7e27ac6ff74a2ac58.webp)

Y220_06004

I OM 600 engine, coolant iflows through the heaterline rear section (cylinder#4 and #of cylinder head. However, in D27DT engine, coolant inflows from cylinder block through oil cooler (refer to coolant flows layout in previous page).

It prevents cooling efficiency from decreasing due to coolant separation between cylinder #4 and #5.

•In OM 600 engine, the coling fan is installed with water pump, however, in case of D27DT engine, t is connected to water pump with an additional pulley.

![](images/1e7b5da750494dc348dca44190f00fcde4e3fb53a67938ee601450740bd1d345.webp)

![](images/d5430eac81ad8d2bd00d58485f067d7881ddf03e4737037668865abb5fff6c90.webp)

# Radiator

This vehicle has a lightweight tube-and-fin aluminum radiator.   
Be careful not to damage the radiator core when servicing.

![](images/b3eb7522a0009e48458655868d5099eb7d478630b5ef84f40ca5bd334e53b4a9.webp)

# Water pump

The belt-driven centrifugal water pump consists of an impeller, a drive shaft, and a belt pulley. The impeller is supported by a completely sealed bearing.

The water pump is serviced as an assembly and, therefore, cannot be disassembled.

# Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the engine and radiator are hot.

The coolant reservoir is a transparent plastic reservoir, similar to the windshield washer reservoir. The coolant reservoir is connected to the radiator by a hose and to the engine cooling system by another hose. As the vehicle is driven, the engine coolant heats and expands. The portion of the engine coolant displaced by this expansion flows from the radiator and the engine into the coolant reservoir. The air trapped in the radiator and the engine is degassed into the coolant reservoir.

When the engine stops, the engine coolant cools and contracts. The displaced engine coolant is then drawn back into the radiator and the engine. This keeps the radiator filled with the coolant to the desired level at all times and increases the cooling efficiency. Maintain the coolant level between the MIN and MAX marks on the coolant reservoir when the system is cold.

![](images/3e6116e0f5adda9a167f5974f3ed64c1de4f3c2ac46473b3c6987bd36bb98643.webp)

# Thermostat

A wax pellet-type thermostat controls the flow of the engine coolant through the engine cooling system. The thermostat is mounted in the thermostat housing to the front of the cylinder head. The thermostat stops the flow of the engine coolant from the engine to the radiator to provide faster warm-up, and to regulate the coolant temperature. The thermostat remains closed while the engine coolant is cold, preventing circulation of the engine coolant through the radiator. At this point, the engine coolant is allowed to circulate only throughout the heater core to warm it quickly and evenly. As the engine warms, the thermostat opens. This allows the engine coolant to flow through the radiator where the heat is dissipated. This opening and closing of the thermostat permits enough engine coolant to enter the radiator to keep the engine within proper engine temperature operating limits. The wax pellet in the thermostat is hermetically sealed in a metal case. The wax element of the thermostat expands when it is heated and contracts when it is cooled. As the vehicle is driven and the engine warms, the engine coolant temperature increases. When the engine coolant reaches a specified temperature, the wax pellet element in the thermostat expands and exerts pressure against the metal case, forcing the valve open. This allows the engine coolant to flow through the engine cooling system and cool the engine. As the wax pellet cools, the contraction allows a spring to close the valve.

The thermostat begins to open at 85°C and is fully open at 100°C. The thermostat closes at 85°C.

![](images/e4d4a22839631a8bbcbf339b816ccdd5820e3b410cff83fdcf470456b7fcaae4.webp)

![](images/8f03c42538d6bc8501a9cdc92fb37edb62fbf7988521469c2a01395467a30e75.webp)

![](images/1ccb972969af2cdb0057e5a236a694f0c7aa0f6c57d9e92ed8a984e1c2af826d.webp)

# When closed (up to 85°C)

![](images/bf66a5bf2353a8fa793c2eb64c31d8c928d6f023c38151b72cc1bc11066b8fa6.webp)

X. from vrankcase

Y. to crankcase

Z. from radiator

# When fully opened (above 100°C)

If the cooling system is fully filled with, the coolant is automatically bled through ball valve (arrow) in thermostat.

# When partially opened (85°C \~ 100°C)

![](images/49a67595bd36c55416b6b9d2696adb3091138d53d7d6ec793f819166e2c2023d.webp)

Y220_06010

![](images/8062ae80f412d560dd279036c57aa60f6454a16e819c92c80344b0154e832845.webp)

![](images/339364ee1b6ef7b31795b024c3288916210d9223858f72cf6683076518aa6b76.webp)

![](images/24727c1c40375a1b8f56f6dc8fa0ebc0dee2b216fa90718181bc042296ac7723.webp)

# Viscous fan clutch

![](images/6396dfb3ff2cf1d460e3f054ef31a5862e91531af8dbda06702d24cf3b1eb1c6.webp)

Y220_06013

1. Clutch housing 9. Pin   
2. Drive disc 10. Bi-metal   
3. Flange 11. Bracket cover   
4. Seal ring 12. Separator disc   
5. Needle bearing 13. Supply port   
6. Cooling fan 14. Lever valve   
7. Oil scraper 15. Oil chamber   
8. Spring 16. Operating chamber

The cooling speed increases approx. 1,000 rpm with wind noise when the engine speed is 4,000 to 4,500 rpm and the coolant temperature is 90 to 95°C.

# Notice

Keep hands, tools, and clothing away from the engine cooling fans to help prevent personal injury. This fan is electric and can turn on even when the engine is not running.

# Notice

If a fan blade is bent or damaged in any way, no attempt should be made to repair or reuse the damaged part. A bent or damaged fan assembly should always be replaced with a new one to prevent possible injury.

![](images/75cf43fc2199b24c46431d199c6a6b1451e70fc5e0cb3bb52c40b4b43b86f518.webp)

The cooling fans are mounted behind the radiator in the engine compartment. The electric cooling fans increase the flow of air across the radiator fins and across the condenser on air conditioner. The fan is 320 mm in diameter with five blades to aid the airflow through the radiator and the condenser. An electric motor attached to the radiator support drives the fan.

1. A/C Off or Non-AC Model •The cooling fan operates at low speed when the coolant temperature reaches 95°C and at high speed when the coolant temperature reaches 100°C. • The cooling fan is turned from high speed to low speed at 97°C and turns off at 90°C.

# 2. A/C On

• The ECU will turn the cooling fan on at high speed when the A/C system is on.

# Engine coolant temperature sensor

The Engine Coolant Temperature (ECT) sensor uses a temperature to control the signal voltage to the Engine Control Unit (ECU).

![](images/63e8d4f7ccc247fd1493f759a9afd9c9cf4d82f0cc3d75dca25df02d1c2604e2.webp)

![](images/cb9b8e5e0a5f864697d4aba3957e6e2bf993d9fd13ede714476dc383c9a6958a.webp)

# SPECIFICATIONS

![](images/f92e2e88a92d302cbf1237011a5b3b22ee7157f19365bb81a43b993e83489c63.webp)

![](images/51f290ddaca39167e539e0225f7240f45d050ef85e46fd1a0c047faba03d62e4.webp)

# Coolant Level Check

Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the engine and radiator are hot.

Take precautions to prevent antifreeze coming in contact with the skin, eyes or vehicle body. If contact happens, rinse affected areas immediately with plenty of water.

1. Place the vehicle on a level ground and check the coolant level through the coolant reservoir.   
.Add if needed. Change the coolant if necessary.

![](images/4e0bc9f239b08919234cea9d5672a588c5b8d3d1894085dc4613dd977c529dae.webp)

![](images/00c4b95f8cf8e5e740e9981cff6144cd1bf71d9b01091ed3994d67f7d042175e.webp)

# Coolant Temperature Sensor

![](images/10ea631b08202628eb1c90f1a78b6734776080f3a57e4c4cc64674662cb5e2e6.webp)  
Y220_06017

Coolant temperature sensor is a NTC resister that sends coolant temperature to ECU.

NTC resister has characteristicsthat if the engine temperature rises, the resistance lowers so the ECU detects lowering signal voltages.

If the fuel injectedinto theengine trough ijector has more turulence, then combusts very wel. However if engine temperature is too low, the fuel injected as foggy state forms big compounds causing incomplete combustion. So the sensor detects coolant temperature and changes coolant temperature changes into voltage then sends to ECU to increasethe fuel volume during cold start for better starting. And detects engine overheating for fuel volume reduction to protect the engine.

ECU functions as below with coolant temperature sensor signals.

•When engine is cold, controls fuel volume to correct idle speed   
•When engine is overheated, controls electrical fan and A/C compressor to protect the engine   
•Sends information for emission control

![](images/c620d6df92e6010f36bf7f8f48656d370df45a547f74ef631da8d6bf671c4481.webp)

![](images/25f8fdef73d9f650a6198f281cb326ea7860e517f51ad28cc2c30ad0e5a601f1.webp)

<Coolant Temperature Sensor Circuit>

![](images/54a919722b74f1f77e9cda48a77d0bd1975da1cbd1efc96df00e28ff8f5deef2.webp)

# Trouble Diagnosis

![](images/e9e9fb3c66b959eb3a4f79e5fb95f08a72ca4f367481c0a1032b68a378c4f21e.webp)

![](images/e09fa45bd23f826759f40271d2eb81790ef480a124f7779051b373bf5d2ade45.webp)

# INSPECTION AND REPAIR

![](images/d9cc308cc08c333d3d678c01155996b1c62bf9c6af6ac1c85d6f25c574d05ff5.webp)

Release the pressure from coolant reservoir by loosening one notch of coolant reservoir cap, and then remove the cap.

# Notice

Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the before the temperature goes down below 90°C.

# Cooling System

![](images/eae1809ac52dc3755a6f26577ade3abd7d8d181042e928b786a2b9fc8d9a9066.webp)

Add the coolant up to upper mark (arrow) on the reservoir.

3. Install the tester to the coolant reservoir and apply the pressure of 1.4 bar.   
4Check the coolant hoses, pipes and connections for leaks after the pointer of the tester drops. Replace or retighten as required.

![](images/301176a52dced19b7ad436c9903b4ddb6c2f7db978d12cafd63dc1fbb7a501d3.webp)

Y220_06021

# Thermostat

Immerse the thermostat into the water. Heat the water and check the valve opening temperature.

![](images/5c139977594cebb2d1620cbbe9896bc6427eb8005c7962e18b2ebb0fba435d96.webp)

![](images/2d92a2de948dd50e560ce58499adeaca5ca7b95ce50fed045c0ee9fdb017cc04.webp)

# Coolant Temperature Gauge Unit

1. Immerse the senor unit into the water. Heat the water and check the resistance.

![](images/9bf92f39d5cef2a2229ce42d3dbb0593660814cf8c89cc3d7881e57917f5fbac.webp)

Y220_06022

2. If the measured resistance is out of specified value, replace the gauge unit.

3. Measure the resistance between terminal A and gauge unit housing, and terminal B and gauge unit housing.

![](images/21b5af7e9aa1118a11b23d4e33dbaaec9329599c2933d0e8abaa49d55e7d4dd8.webp)

![](images/9953c6c5cbb591aae131f13183f98aa0f91b22bbc2da08b70e9992a2d1ff054f.webp)  
Terminal A

Terminal B

Y220_06023

# Thermostat

1. Immerse the thermostat into the oil. Heat the oil until it reaches the specified temperature and check if the coolant temperature switch is turned “OFF”.

![](images/1fa6d7b9abbe75b946feae4ba8b4904be09dbd4c69aaa723f06fcb0024045362.webp)

# Notice

Use only engine oil for this inspection. Stir the oil during heating it. Never heat the oil over required temperature.

![](images/d94e667f8a01705a9e89c184a2f8fe96e21ead091e56095fb2b08bdf8a9616df.webp)

Y220_06024

![](images/d72b5b7bae156cdbfc6138892852d5f0b9de4d8b299564f45807c909d05268e1.webp)

# REMOVAL AND INSTALLATION

![](images/18d5ecf4768c67055b0870dec4ff303b7bcea012c67032adf234f2f5c5179f18.webp)

# Coolant Hose (Inlet/Outlet)

Preceding Work: Draining of coolant

1. Loosen the clamp and remove the coolant outlet hose (engine to radiator).

2. Disconnect the HFM sensor connector.   
3Remove the air intake duct from the air cleaner.

4. Loosen the clamp and remove the coolant inlet hose (radiator to thermostat housing).

Y220_06027

![](images/955ba5fc2b66c612abd0a50ba1784bea9888f64b2f9e12bda2858267907b9b5a.webp)

5Lift up the vehicle and remove the skid plate.   
6Loosen the clamp and remove the lower inlet hose.

![](images/9289dcabfdfefa1ee91cd1a9d3f41cdd7f0746f05df4b8ba96bd13cef2bd0667.webp)

# Shroud and Cooling Fan/Clutch

Preceding Works:

-  Draining of coolant   
- Removal of coolant inlet and outlet hose   
- Removal of V-belt

Remove the radiator grille.

Remove the air intake hoses.   
3. Set aside the coolant return pipe.

![](images/c8f366c6df7e0eac7ce5cff627e08e56c8c4e4b918a6f998f6af8d010460f24d.webp)

4.Unscrew the upper bolts and loosen the shroud.

![](images/4400deac73e997f4d62a3ad296d9bbb7db412e78d1b8820e08348d5b7d53c607.webp)

![](images/945fb345bcc91295f1baac39d23ced0327a82a0d33d9c343eaf993348a9e8b3c.webp)

5Unscrew the center bolt and remove the cooling fan clutch while holding the pulley with counter holder (special tool).

Installation Notice

![](images/1198ee40807d6d1fb5b230f07e65a943561039ae17bbf585bd40e51b623d0b37.webp)

6Remove the shroud.   
7 Install in the reverse order of removal.

![](images/8cec428a257f1c4ad1ad9dba6e5e51b9e8b340cc76d497c7f289b21ac53e2a09.webp)

# Water Pump - Assembly

Preceding Works:

- Draining of coolant - Removal of V-belt -Removal of shroud -Removal of cooling fan

![](images/a0b4687ecbe5ca8012eb5872b57deb81cb2759582f4511190a6129ea93cc9f17.webp)

Y220_06035

1. Thermostat housing 4. Belt pulley   
2. Gasket.. Replace 5. Bolt... . 10 Nm   
3. Bolt .. .. 10 Nm 6. Water pump

1.Remove the V-belt while pressing down the auto tensioner adjusting bolt.

![](images/e90cebcc2868894827b67df956de048d19484a002ed42dfafe79a655275c4dd6.webp)

![](images/66b8a55d53dff64562c11725501e105343f9bc156eda89d0c52f630c78372b0b.webp)

![](images/8b24e50f3f24177c3502cdd3357a36edc34b298cc9c8ef4e61a5b2888dd30fed.webp)

![](images/58ae667ba737c77c18868af94f3cf1a7c5790963f1dc8baf1afda02d736c6c86.webp)

![](images/d5c3e7b569d3da0f3778c5fd114aad78c8f5ed7deadf979bf480ab749d7de8bf.webp)

Unscrew the bolts and remove the EGR pipe and bracket. Installation Notice

![](images/05e5ab54c87045dbd0ef0c74e4fc3c387cc585ebec06afff25d1dead9145ac0e.webp)

3. Unscrew the bolts and remove the belt pulley while holding the belt pulley with a special tool.

# Installation Notice

![](images/aca58423ba7155f247f1a638585b5b07ee016301390cdd53ef627f65e5f625ac.webp)

Remove the oil dipstick tube.

# Notice

• Replace the O-ring in oil dipstick with new one. • Plug the oil dipstick hole with a cap not to get the foreign materials into the engine.

5Unscrew the bolts and remove the water pump assembly. Installation Notice

![](images/278337e773c7972caeb0f3055387d6daf0e997cc855ef4a34f321b62d8325b91.webp)

# Notice

Remove the gasket residues from the sealing surface and replace the gasket with new one.

6 Install in the reverse order of removal.

# \* Preceding Works:

-Draining of coolant   
-Removal of V-belt   
-Removal of cooling fan   
-Removal of intake duct (air cleaner to turbo charger)

![](images/71fe110a8bb01dc8f625de6cf502092ab5bba4863929e7dd532ad235fb9a855a.webp)

Y220_06041

1.Gasket. .Replace 5. Thermostat   
2. Water pump housing 6. Seal   
3. Connector 7. Coolant hose   
4. Bolt . . 10 Nm

![](images/f787476efea3d7e07654ce6f5ecdf058a0061fdd789c419808dc4995fbf0a4c9.webp)

![](images/906336207cb94ea5d700f5dba71e07286309c41b0fc6a0a2ee7228d9422a1c10.webp)

![](images/644efc2249fb889aad2235e7ebb0b76adc3093bea4ee4caee15ec4d600a4db42.webp)

Unscrew the bolts and remove the thermostat housing. Installation Notice

![](images/9232322133310e77179ca1a78d63773c8061f1e9ad4857c34c5319012405cda4.webp)

2Remove the thermostat.   
3 Install in the reverse order of removal.

# Water Pump Housing

Preceding Works:

-Removal of water pump assembly -Removal of thermostat assembly

Remove the heater hose.

Unscrew the bolts and remove the alternator. Installation Notice

![](images/c33a108ee276a47fa5e0e8aa60f25b46aa5258ac0fe55d1479bc6fdaf9fbf001.webp)

3. Unscrew the bolts and remove the alternator bracket. Installation Notice

![](images/2ce0bafd27ca124c83c7b27a2d73fe8efa6a011a86ecee5cb64ae65329fad530.webp)

![](images/c8970c3f7bed8197c93f30d79d1a03f824db75847ccf96dc41759ff6e0ff4e46.webp)

![](images/fec6324ef9dd02e51fb3da918c926facb1ab0a3eb984836061f47e8c2a371bf3.webp)

Unscrew the bolts and remove the water pump housing. Installation Notice

![](images/d506a4d85382bef0124bfc05cf9a2c69c721288b9136b11d87ac8b065088d39f.webp)

# Notice

•Be careful not to damage the O-ring in coolant outlet pipe (cylinder head side). •Remove the gasket residues from the sealing surface and replace the gasket with new one.

5 Install in the reverse order of removal.

![](images/e4e5bcddbe2b9e99946964d851bc954d08f3249e6f3a49131448341a17287907.webp)

![](images/4fd0abc16067f85913254e547d346e266910b8b54306ea45bb021f3f3e1122f9.webp)

# Radiator

Preceding Work: Draining of coolant

1 Lift up the vehicle and remove the skid plate.

![](images/e7e13a4a9c5ced539890aea7343ce2d4bdcdd809e40fb242bde09f71d447e80b.webp)

Remove the clips and washers from bottom of radiator at both sides.

# Notice

Be careful not to damage the rubber bushing.

![](images/57b1d45f9251a12c2ad68af020a6788d5ec963378487d2daf8c8f17f1a7bcdf9.webp)

3. Unscrew the bracket mounting bolts under the radiator condenser.

Installation Notice

![](images/f9057ac1b962702b422f8bd73fba0aef79f835afc4b9196161aa7925a52e5e54.webp)

![](images/d3447a9a2b39a02a6f15fd60923fc73830c11210959cfce5eb569ac4dc0d1706.webp)

![](images/22f7c75627a68fd7778c33adf2837ba12fac08d913cf36605a56afc84e0fee70.webp)

4. Disconnect the oil inlet and outlet hoses from bottom of radiator.

# Notice

•Plug the radiator oil holes with caps.   
•Replace the hose washers with new ones.

Remove the coolant outlet hose.

![](images/337740ec29e9345708955ae3ba0a1f26f42eda2e0a9e6bfcc408b41d107200cc.webp)

Remove the radiator grille.

7. Remove the coolant inlet hose and the cooler inlet hose.   
8Remove the coolant return hose.

9Unscrew the bolts and remove the shroud.

![](images/6cc0c04ea899d5fe8a0b3b980038588c3d8ef5646db3db8e8d5af860ccb4d1f5.webp)

![](images/04c546b85e3c32079b910fd2fc980d5c898f5aa8afb795980cb66de44eb6184e.webp)

![](images/726b23c6e9b2412bb052e8bc9d9fa3b42d722e85c6dcf6ddd6524c1f772c3ebe.webp)

10.Unscrew the bolts and remove the radiator upper plate. Installation Notice

![](images/b3a66514e2b0a4f4619100eded9f5c44ef70bbbc8ebebe6c7a7a7922671557e3.webp)

11. Unscrew the bracket mounting bolts on the radiator condenser.

Installation Notice

![](images/5f34c4ae15e5d52d67aa2eedaae879c232adc257e371b4f5ff115591d87aff64.webp)

1Remove the radiator by pulling it up carefully.

13 Instal in the reverse order of removal.

![](images/715ee5402f1ee71ef2d2abb138ea115205fb58c1c95eb150b9abe873d1d6b8c2.webp)

# Coolant Reservoir

1. Drain the coolant.   
Remove the hoses.

![](images/515f12e9a270ddb2bbf2bbfb07f73b79f103f21d0d0d687e1d67b66e520d9b97.webp)

3. Unscrew the bolts and remove the coolant reservoir. Installation Notice

![](images/09d26af44c3f0b335900d5a347f97b71e06d6b47f7adfa6133c33fae0ade31be.webp)

4 Install in the reverse order of removal.

![](images/45df026df5c852b790de65148dee4efff1b7eea10ad8178f4768bf6d5d9a1ece.webp)

![](images/930cdcf4555e3ca67a672f400b6c0a5cfb39dee26da36562044148bd0b1e9c83.webp)

# Draining and Adding of Coolant

Release the pressure from coolant reservoir by loosening one notch of coolant reservoir cap, and then remove the cap.

# Notice

Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the before the temperature goes down below 90°C.

2. Loosen the drain plug in bottom of radiator and drain the coolant.

# Notice

Collect the drained coolant with a proper container.

3.Remove the drain plug (1) and seal (2) in the cylinder block and drain the coolant.

Replace the seal with new one and install the drain plug. Installation Notice

![](images/84b9e33fae2f97637d36e0a51fcb6aa40f0fb0939e95d61d18f686fbc2a8865e.webp)

5 Install the drain plug in bottom of radiator.   
6. Add the coolant through the coolant reservoir.

# Notice

•Keep the coolant mixture ratio of 50:50 (water : antifreezer).   
•Add the coolant until the water flows out through the overflow hose.

7.Warm up the engine until the thermostat begins to open and check if the coolant level is at “FULL” mark on the reservoir. Add if necessary.

![](images/e6a1e9faef77cff589306fbaa41a18458b48886bad1a2f31ac7ef3b7b06c4419.webp)

# PREHEATING SYSTEM

![](images/2d91a3cc786853c8d001b20e126dd81df57a3e5d79ac4281e656b0e6c3fb39d4.webp)

![](images/9f5c651e69d5797976e07981b2b9aa602256301cd5d158d05c9b1192b35441c0.webp)

![](images/41b8d2a3b7513bf270649847694c1303d770c6a7435fcffd02d72e14e6fe386b.webp)

# OVERVIEW

Glow plug is installed on the cylinder head (combustion chamber) in the D27DT preheating control unit system. Col starting performance has improved and exhaust gas during cold starting has reduced.

ECU receives coolant temperature and engine speed to control; after monitoring the engine preheating/after heating anc glow plug diagnosis function, the fault contents will be delivered to ECU.

•Engine preheating/after heating functions   
•Preheating relay activation by ECU controls -Senses engine temperature and controls the preheating/after heating time - Glow indicator   
• K-LINE for information exchanges between preheating unit and ECU - Transmits preheating unit self-diagnosis results to ECU -Transmits glow plug diagnosis results and operating status to ECU

# PREHEATING RELAY

![](images/20ffd44261cd83c1242031483b92796e302dfb1a081d785dbdc77bf4da86517b.webp)

![](images/6872142ce15fa5e9702427e138ae111f2cc233bd54ee2006d27881ac081ded8f.webp)

# PREHEATING SYSTEM DIAGRAM

![](images/6c538abcf6e03788d8e1b95ecc705674bb20fd09f99c5867d3aad7949137a789.webp)

Y220_06070

# Specifications

![](images/222ff8d9d7d9108dfecf8d0e01f40e85ff20b3cf160277e9587bbcac5e8df7f2.webp)

![](images/dfbdd79cc963bddac823758b09019520f08669a3d06302d1e750506f03327f23.webp)

# Function

Preheating system controls and checks follwing functions and operating conditions.

# Pre-Heating

The power wil be supplied to the glow plugs by ECU controls when the power is supplied to the IG terminal from the battery and there are normal communications with ECU within 2 seconds. The surface of glow plug will be heated up to 850°C very quickly to aid combustion by vaporizing air-fuel mixture during compression stroke. Preheating time is controlled by ECU.

# After-heating

When the engine is started, after-heating starts by ECU controls. The idle rpm wil be increased to reduce toxic smoke, pollutants and noises.   
After-heating time is controlled by ECU.

# Checking glow plugs

•Check each glow plug for short in circuit •Check each glow plug for open in circuit due to overvoltage Check glow plug for short to ground

# Forceful relay shut-down

•When glow plug is shorted to ground

# K-Line communication

•ECU sends the results to preheating time control relay through K-Line to start communication.   
Preheating time control relay sends messages including self-diagnosis data for glow plugs to ECU.   
•Glow plug makes communication only as response to demand.   
•When power is supplied, ECU starts self-diagnosis within 2 seconds.   
•Under the following conditions, communication error occurs. -When there is no response from glow plug module within 2 seconds -  When an error is detected in checksum -Less byte is received

Error code of “P1720 - Pre heating control communication fail” will be reported.

# Operating time

![](images/d024a638301b9115d17c6dd5bfffd48e48dfa30db789a20307366fc6974fb5c5.webp)

![](images/4e3c07ed080a343327fe6585271ff5a483a96b4d48ed337435cf075b3a266686.webp)

# Table of Contents

CAUTIONS FOR DI ENGINE. .DI07-3   
FUEL SYSTEM. DI07-6   
Fuel injection system DI07-6   
Fuel transfer line. DI07-12   
Inlet metering valve (IMV) DI07-14   
High fuel pressure line DI07-17   
Injector DI07-48

![](images/07e77534c3b4b62544d12ef458cb803b4ef7b61aab63e79848bff042b2db3f72.webp)

# CAUTIONS FOR DI ENGINE

This chapter describes the cautions for DI engine equipped vehicle. This includes the water separation from engine, warning lights, symptoms when engine malfunctioning, causes and actions.

# DI Engine

Comparatively conventional diesel engines, DI engine controls the fuel injection and timing electrically, delivers high power and reduces less emission.

# Water Separator Warning Light

When a severe failure has been occurred in a vehicle, the system safety mode is activated to protect the system. It reduces the driving force, restricts the engine speed (rpm) and stops engine operation. Refer to “Diagnosis” section in this manual.

When the water level inside water separator in fuel filter exceeds a certain level (approx. 39 cc), this warning light comes on and buzzer sounds.

Also, the driving force of the vehicle decreases (torque reduction). If these conditions occur, immediately drain the water from fuel filter.

For the draining procedures, please refer to “How to drain the water from fuel filter" section.

![](images/087be59af74147eaedf9c9722e79c64efc614b019c406d742e62bdd5e4e1f48d.webp)

# Priming Pump

The priming pump installed in fuel pump is the device to fil the fuel into the fuel fiter. When the vehicle is under the conditions as below, press the priming pump until it becomes rigid before starting the engine.

WARNING

Never reverse filter or use it in other place (clean side)

# Conditions for using Priming Pump

1. After run out of fuel After draining the water from fuel separator 3. After replacing filter or any intervention on system

# Fuel Filter and Water Separator

![](images/1acc366a2c4063337e95b1442e67b5ded47c595f67f9f9fdacdc2a7adcd17351.webp)

![](images/8a8f59848fe0375ef62d4837392f6ad3f535406fa272714e2b2f2e730ef074c0.webp)

Y220_07003

1. Fuel filter   
3. Priming pump

2. Water drain plug (to be drained every 15,000km max.) Draining could be done at same time than oil change

# Notice

When replaced the fuel filter or drained the water from fuel filter, press the priming pump until it becomes rigid before starting the engine. •The water drain from fuel filter should be performed whenever changing the engine oil.

![](images/6a50245ed7886769d8e73d28179a4d8ff3e148ee1a10f8e4a610134c4541ce36.webp)

# Draining the Water From Fuel Filter

1Place the water container under the fuel filter.

![](images/f72dd8d6e3cab7d2367b7189be0e073817bc83816cbfa5b478b54cdf74837352.webp)

Turn the drain plug (2) to “A” direction to drain the water. 3. Press priming pump until all water is drained, then turn the drain plug to “B” direction to tighten it.

# Notice

Be careful not to be injured by surrounding equipment during the working procedures.

![](images/ebc3564bc4435862b0ad7c7f785c7de6d035086938ca2aa555ff4150dd7294f1.webp)

4.Press the priming pump until it becomes rigid.   
5. Start the engine and check the conditions.   
6. Clear the fault code of ECU with scan 100.

# WARNING

If the priming pump is not properly operated, air may get into the fuel line. It may cause starting problem or fuel system problem. Make sure to perform the job in step 4.

![](images/00273787e2f8de2e6c840a1f56550bbaea55969714d19219ba6cb1a300b4a665.webp)

![](images/3157f151d189bb548c752e3c0c69c090a8ec0fb0fef6b6c8b9a798da3834a120.webp)

# Electronic Control of Fuel System

![](images/6c50c1aa7d90717ef5868c4fb4240580916f480cfaedee4671b5b9766e015841.webp)

# System composition

- High pressure fuel pump - Fuel rail - Fuel pressure sensor Rupr ine - Fuel injector - Electronic control unit (ECu) - Other sensors and actuators ECU connecting line Y220 07007

According to input signals from various sensors, engine ECU calculates driver's demand (position of the accelerato jedal) and then controls overall operating performance of engine and vehicle on that time.

ECU receives signals from sensors via dataline and then performs efective engine air-fuel ratio controls based on those signals. Engine speed is measured by crankshaft speed (position) sensor and camshaftspeed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal thatis generated by variable resistance changes in accelerator pedal sensor. Air flow (hot flm) sensor detect intake air volume and sends the signals to ECU. Especiall, the engine ECU controls the air-fuel ratio by recognizing instant air volume changes from air flow sensor to decrease the emissons (EGR valve control. Furthermore, ECU uses signals from coolant temperature sensor and air temperature sensor, booster pressure sensor and atmospheric pressure sensor as compensation signalto respond to injection starting, pilot injection set values, various operations and variables.

![](images/3077c069313a3fae79c2aa2ac0858c6f5f9e6b78c330cf4bc920839b81ba9991.webp)

# Composition of Fuel System

Components in fuel system are designed to generate and distribute high pressure, and they are controlld electronically by engine ECU. Accordingly, fuel system is completely diffrent from injection pump type fuel supply system on the conventional Diesel engine. The fuel injection system in common rail engine is composed of transfer pressure section that transfers fuel in low pressure, high pressure section that transfers fuel in high pressure and ECU control section.

![](images/7999cda2e2c55eff24ad3f3eb2e1751db15bd33f5fee61ba14c842c1d29b5f16.webp)

Fuel route

![](images/db2f086379111027adb01b11fe431df7dbeff6c8e0ab5c1b6b9401ef0c159713.webp)

![](images/f524bd85a87d55711907a51a27171ddadf5ffcd47c714cca1292dc01a73db9de.webp)

# Hydraulic cycle in Fuel Line (Transfer and High Pressure Line)

![](images/07f4083779e523eb508c3b3d2279d7e3305f9bcf25a6cb8a2b262020f66a7415.webp)

Y220_07009

![](images/f6a17ceaa031a4849d1d130dbc57f2c22d1f6bb9729e62cf0233ec9bbd69c078.webp)

# Components of Low Pressure Transfer Line

Low pressure stage is to supply sufficient fuel to high pressure section and components are as below.

•Fuel tank (including strainer)   
•Hand priming pump   
Fuel filter   
Transfer pump   
•Other low pressure fuel hoses

# Fuel tank

Fuel tank is made of anti-corrosion material and its allowable pressure is 2 times of operating pressure (more than 0.3 bar). It has protective cap and safety valve to prevent excessive pressure building. Also, it has structure to prevent fuel from leaking in shocks, slopes and corners and to supply fuel smoothly.

![](images/9a89ff4af9110f1ff7fce8045d3c486a6170978c61b95c6b11ab40b577cc108e.webp)

# Priming pump

If fuel runs out during driving or air gets into fuel line after fuel filter replacement, it may cause poor engine starting or damage to each component. Therefore, the hand priming pump is installed to bleed air from transfer line.

When the vehicle is under the conditions as below, press the priming pump until it becomes rigid before starting the engine.

-  After run out of fuel - After draining the water from fuel filter -After replacing the fuel filter

Press the priming pump until it becomes rigid before starting the engine.

# Fuel filter

It requires more purified fuel supply than conventional diesel engine. If there are foreign materials in the fuel, fuel system including pump components, delivery valve and injector nozzles may be damaged.

Fuel filter purifies fuel before it reaches to high pressure pump to help proper operations in high pressure pump. And more, it separates water from fuel to prevent water from getting into FIE system (high pressure line).

![](images/19e469c472b1cae4eee3ed9a81f825b4c08b88c2942e5da56b6da9b4d1b8b50d.webp)

![](images/971613504e069f331a04a958e48d8ab8639f5bd510945c3a297e4568860334e2.webp)

Y220_07012

![](images/61d0d1260a4cf35c6fa316170f9986b97ae1b198dd392b7b1e118e6b6f886df4.webp)

# Components of High Pressure Transfer Line

In the high pressure section, sufficient fuel pressure that injectors requires wil be generated and stored. The compo nents are as below:

•High pressure pump   
•Rail pressure sensor   
Pressure limit valve   
• Common rail   
•High pressure pipe   
Injector   
•Fuel pressure regulating valve (IMV)

![](images/e9217158b724e889a61926fd96c717dc309f866526031b0837f20e8905c0a244.webp)

# High pressure pump (including IMV and limit valve)

This is plunger pump that generates high pressure; and driven by crankshaft with timing chain. The high pressure pump increases system pressure of fuel to approx. 1,600 bar and this compressed fuel is transferred to high pressure accumulator (common rail) in tube through high pressure line.

# Common rail (including pressure sensor)

It stores fuel transferred from high pressure pump and also stores actual high pressure of fuel. Even though the injectors inject fuel from the rail, the fuel pressure in the rail is maintained to a specific value. It is because the effect of accumulator is increased by unique elasticity of fuel. Fuel pressure is measured by rail pressure sensor. And the inlet metering valve (IMV) included in high pressure pump housing keeps pressure to a desired level.

![](images/c0341785c4e732c4620f3b961510cbc2eaf0af77dfd54104c3feb1e632550cf6.webp)

# High pressure pipe (fuel pipe)

Fuel line transfers high pressure fuel. Accordingly, it is made of steel to endure intermittent high frequency pressure changes that occur under maximum system pressure and injection stops. Injection lines between rail and injectors are all in the same length; it means the lengths between the rail and each injector are the same and the differences in length are compensated by each bending.

![](images/82bfe5a38d26400e955ef0871a3d800a1814fc8330b692a0f32627284fb16094.webp)

# Injectors

The fuel injection device is composed of electrical solenoid valve, needle and nozzle and controlled by engine ECU. The injector nozzle opens when solenoid valve is activated to directly inject the fuel into combustion chamber in engine. When injector nozzle is open, remaining fuel after injection returns to fuel tank through return line.

# Transfer pump

The transfer pump is included in the housing of the high pressure pump. The transfer pump is the volumetric blade type pump. To deliver the continuously required fuel volume, the pump transfers fuel from the fuel tank to high pressure pump.

![](images/9c9c82017ee606803e0cd9e893071ae0b7a2e817793938095b8bcb36f0699fb9.webp)

# Fuel Filter Replacement

\* Fuel filter change interval: every 30,000 km   
\* Water separation interval: every 15,000 km max. (same with engine oil change interval)   
\* Never reuse the removed fuel filter

![](images/3df3350b029b3f3089674edd2b0faa241699db9c7270ab2222ff9d5b8f0b0557.webp)

# FUEL TRANSFER LINE

The transfer pump is the device to provide suficient fuel to high fuel pressure line and is mechanical type feed pump that is driven by timing chain linked to crankshaft. This mechanical type feed pump is subject to air iflow, therefore, a hand priming pump is installed to fillfuel in Low fuel pressure(LP) circuit.

The transfer pump is included in the housing of the HP pump. The transfer pump is the volumetric blade type pump an consists of the following components:

•A rotor turned by the shaft of the HP pump. The connection is provided by splines.   
Aneccentric liner fixed to the housing of the HP pump by 6 Torx bolts. The liner is positioned by two offset pins in order to prevent any assembly errors.   
Four blades set at 90°. Each blade is held against the liner by a coil spring.   
The inlet and outlet orifice.

![](images/c4dd5017da9627da3f96cc89c0bde8899c7922d831130143537b9c7e4f69d527.webp)

![](images/004e3706d76389df059ed94395000c792625f910709a0b0751799113e081a4bc.webp)

# Principle of operation

![](images/a2e299f8f3fe70bc1248e4cff4acdda6884c579b6ee927ccbcadd6030f0c4e82.webp)

Y220_07025

Jonsider the chamber between the rotor, the liner and two successive blades (refer to above figure).

When the chamberi in position 1, the volume of the chamber is minimal. The changes in volume according to the angle of rotation of the rotor are small.   
•The rotor makes a quarter turn clockwise. The previous chamber is now in position 2. The inlet orifice is uncovered. The volume contained in the chamber quickly rises. The pressure inside the chamber drops sharply. Fuel is drawn into the chamber.   
The rotor continues to rotate. t i now in position.The nlet and outlet rifices are now sealed of.The volume area controlled by the rotor, the liner and the two blades is at the maximum. The changes in volume according to the angle of rotation of the rotor are small.   
The rotor continues to rotate. It i finall in position 4. The outlet orifice is uncovered. The volume area controlled by the rotor, the liner and the blades decreases quickly. The pressure inside the chamber rises sharply. The fuel is expelled under pressure. The depression caused by the transfer pump's rotation is suficient to draw in diesel fuel through the filter. The transfer pump is driven by the shaft of the HP pump, transfer pressure thus rises with engine speed.A regulating valve allows the transfer pressure to be maintained at a practically constant level (about 6 bar) throughout the whole range of engine operations by returning some of the fuel to the pump inlet.

![](images/981904386f72759a1a1d6fc3f9d345778b80b323c79474d09b76d66125480eca.webp)

Y220_07026

# Characteristics of the transfer pump

![](images/89b2899dc909a688e8d2858e044950fba9ce98bc4711d07d7d35474be1aef945.webp)
FUEL SYSTEMDI ENG SM - 2004.4

![](images/0869ec39296ff2d65caf2d991210e6ed1f3d33aacbb5032e6c854807a4c8fc1f.webp)

# INLET METERING VALVE (IMV)

![](images/efae912089c4b2d16dc58a094bdd42dabd4e476a6776a84b6920d1e17f3fa15f.webp)

![](images/bf2824619b6affed6d0e1efa72e370201ef9b9f2f060d59cd3f36bd820ce036e.webp)

# Overview

The LP actuator, also called the inlet metering valve, is used to control the rail pressure by regulating the amount of fuel which is sent to the pumping element of the HP pump.

This actuator has two purposes:

Firstly, it allows the efficiency of the injection system to be improved, since the HP pump only compresses the amount of fuel necessary to maintain in the rail the level of pressure required by the system as a function of the engine's operating conditions.

2. Secondary, it allows the temperature to be reduced in the fuel tank. When the excess fuel is discharged into the back leak circuit, the pressure reduction in the fluid (from rail pressure down to atmospheric pressure) gives off a large amount of heat. This leads to a temperature rise in the fuel entering the tank. In order to prevent too high a temperature being reached, it is necessary to limit the amount of heat generated by the fuel pressure reduction, by reducing the back leak flow. To reduce the back leak flow, it is sufficient to adapt the flow of the HP pump to the engine's requirements throughout its operating range.

![](images/110f28f873dc36376085ca39518cdf27535594c9c84e20d7398c2fcc5627153a.webp)

# Composition of IMV

The IMV is located on the hydraulic head ofthe pump. It is fed with fuel by the transfer pump via two radial holes. A cylindrical fiter fitted ver the feed orifices of the MV. This makes it possible to protect not only the LP actuator, but also all the components of the injection system located downstream of the IMV.

The IMV consists of the following components:

•A piston held in the fully open position by a spring.   
•A piston filter located at inlet.   
•Two O-rings ensuring pressure tightness between the hydraulic head and the body of the IMV.   
•A body provided with two radial inlet holes and an axial outlet hole.   
Coil

![](images/c946ae37651a449f7146f31c706f8fdda4b476311117642d6a86b10714b65da6.webp)

Y220_07019

![](images/cf6d8556983a6584ff749e85662768e1a14b2daf9ced03afd8eccac38641f256.webp)

# Principle of Operation

The LP actuator is used to proportion the amount of fuel sent to the pumping element of the HP pump in such a way that the pressure measured by the HP sensor is equal to the pressure demand sent out by the ECU. At each point of operation, it is necessary to have:

•Flow introduced into the HP pump = Injected flow + Injector backleak flow + injector control flow The IMV is normal open when itis not being supplied with fuel. It cannot therefore be used as a safety device to shut down the engine if required. The IMV is controlled by current. The flow/current law is represented below.

![](images/0c1ed57e438cb5fcb19daf459382650d6dda1b09dfbf16fe4c137a42e2cd11f2.webp)

# Specifications

![](images/ad3f8e3757553356a4cdd0d23b20a7f0da3dc506ef3c6cc4fd49e5b606223b53.webp)

•ECU determines the value of the current to be sent to the IMV according to:

![](images/076f4bfdf89c99c79f62a38c5ce937f2e709021d1acd23f1f357b01077202303.webp)

![](images/4747a8f10cf7a1bbb996cffc594e2dac5e2f08e00f9514587f420b855fb78634.webp)

# HIGH FUEL PRESSURE LINE

This pump generates high fuel pressure and is driven bytiming chain (radial plunger principle). This pump pressurizes the fuel to approx. 1600 bar and sends this high pressurized fuel to high pressure accumulator (common rail via high pressure line.

It is possible to extend the pumping phase in order to considerably reduce drive torque, viration and noise since the pump no longer determines the ijection period.The difrences from conventional rotary pumpslie in the fact thatit i no loger the hydraulichead rotor which turs inside the cam, but the cam which turns around the hydraulichead. Thus, any problems of dynamic pressure tightness are eliminated because the high pressure is generated in the fixed part of the pump.

![](images/b053e032e052097ff13898ecf90640874e97754b74154238e77527a359b6bc0d.webp)

1. IMV (Inlet Metering Valve)   
2. Hydraulic Head   
3. Plunger   
4. Drive shaft and cam ring   
5. Housing   
6. Roller and shoe   
7. Transfer pump   
8. Fuel temperature sensor   
9. High fuel pressure - OUT   
10. Pressure regulator

Y220_07021

# Specifications

•Maximum operating pressure: 1600 ± 150 bar   
• Max. Overpressure: 2100 bar   
Maximum sealing pressure: when using a plug instead of PRV, no leaks around pump outlet port (when applying 2500 bar of constant pressure)   
• Operating temperature: Continuously operating within temperature range of -30°C \~ 120°C in engine compartment   
•Inflowing fuel temperature: The maximum inflowing fuel temperature is 85°C (continuously able to operate)   
•Pump inlet pressure: Relative pressure Min. - 0.48 bar (to end of filter's lifetime)   
•Driving torque: 15 Nm / 1600 bar   
•Gear ratio (engine: pump): 0.625   
Lubrication: - Inside lubrication (rear bearing): Fuel - Outside lubrication (front bearing): Engine oil

![](images/a8d6183b67af2c501654e5fdc1b584b49424dac4b64fd7b6ca07da96a6e16eb1.webp)

# Principle of operation

During the filing phase, the rollers are kept in contact with the cam by means of coil springs mounted on either side of each shoe. The transfer pressure is suficient to open the inlet valve and to move the pumping plungers apart. Thus, the dead volume between the two plungers fills with fuel.   
When the diametrically opposite rollrs simultaneously encounter the leading edge of the cam, the plungers are pushed towards each other.   
As soon as the pressure becomes higher than the transfer pressure, the inlet valve closes. When the pressure becomes higher than the pressure inside the rail, the delivery valve opens. Consequently, the fuel is pumped under pressure into the rail.   
•During the input phase, transfer pressure pushes back the inlet valve. Fuel enters the body of the pumping element. The valve closes as soon as the pressure in the pumping element becomes higher than the transfer pressure.   
During the input phase, the ballof the delivery valve is subject to the rail pressure on its outer face and to the transfer pressure on its inner face. Thus the ballrests on its seat, ensuring the pressure tightness of the body of the pumping element. When the pressure in the element becomes higher than the pressure in the rail, the ballis unbalanced and it opens. Fuel is then pumped into the rail at high pressure.

![](images/ba3669a249ff0d1327e001d12af00606140bc2f16b6bc4eb617d5a8a59bec89c.webp)

Y220_07022

This high pressure pump generates the driving torque with low peak torque to maintain the stressto driving components. This torque is smaller than that of conventional injection pump, thus, only a small load willbe applied to pump. The required power to drive pump is determined by set pressure for rail and pump speed (delivery flow). Note that the fuel leakage or defective pressure control valve may affect the engine output.

![](images/45d72e797dcecc294d6b5def0837bc1e46ce97068c22cb35400290b6e5fb9dc0.webp)

# Inlet valve and delivery valve

During the input phase, transfer pressure pushes back the inlet valve. Fuel enters the body of the pumping element. Under the effect of the transfer pressure, the two plungers are forced apart. When the rollers simultaneously encounter the leading edge of the cam, pressure suddenly rises in the body. Of the pumping element. The valve closes as soon as the pressure in the pumping element becomes higher than the transfer pressure.During the input phase, the ballof the delivery valve is subject t the rail pressure on its outer face and to the transfer pressure on its inner face. Thus the ball rests on its seat, ensuring the pressure tightness of the body of the pumping element. When the two diametrically opposite rollers encounter the leading edges of the cam, the plungers are forced together and pressure quickly rises in the body of the pumping element. When the pressure in the element becomes higher than the pressure in the rail the ball is unbalanced and it opens. The spring calibration is negligible compared with the pressure forces. Fuel is then pumped into the rail at high pressure.

![](images/86968b36c07422a97955cbd7dcc49522406460286cbb15727c0926bf49d9b369.webp)

# Lubrication and cooling of the HP pump

Lubrication and cooling ofthe pump are provided by the fuel circulation. The minimum flow required to ensure adequate operation of the pump is 50 /h.

# Phasing of HP pump required and offer 2 advantages

Conventional fuel injection pumps ensure pressurizing and distribution of the fuel to the different injectors. Itis essential to set the pump in such a way that the injection occurs at the required place during the cycle. The HP pump of the common rail system is no longer used for the fuel distribution, it is therefore not necessary to set the pump in relation to the engine.

Nevertheless, the setting or phasing of the pump offers two advantages:

It allows the torque variations of the camshaft and the pump to be synchronized in order to reduce the stresses on the timing belt.   
It allows pressure control to be improved by synchronizing peak pressures produced by the pump with pressuredrops caused by each injection.

This phasing allows pressure stabilityto be improved, which helps to reduce the difference in flow between the cylinders.

![](images/829bee459aa1ea45ca770faa0c4e52c3befa40cba443fcb867b37b79b495037f.webp)

# HP Pump Fuel Route

The fuel passed through the fuel fite is sent to the transfer pump via the HP inlet pump. this fuel passes through the transfer pump by the transferring pressure and maintains the predefined value by the regulating valve in HP pump. Also, this fuel gets into the IMV that controls only the fuel to the high pressure pump.   
The below figure describes the pump operations when acceleration and deceleration.

# When need high fuel pressure (acceleration)

![](images/c893697df27b97f3c171a3eedb956e1f98918ab7a5ee390c7426d8ce4e38c36b.webp)

![](images/cba46955b9b163d78d32b5e44654d9c65ae0b29bfe097db3ac9c2a0d6cee20db.webp)

# When do not need high fuel pressure (deceleration)

![](images/dedab216ae986430c6566c0ad7d29bf6b4568b5075659d2b1b6cfdb86cd25b97.webp)

Y220_07030

The fuel is sent t the high pressure side (hydraulic head) and compressed by the plunger. And, goes into the commor 'ail through the high pressure pipe.

The IMV installed in the high pressure side (hydraulic head) of HP pump precisely controls the fuel amount and delivers he rail pressure feedback same as required amount.

The IMV is controlled by ECU.

# Performance curve of HP pump

The time required to obtain a suficient pressure in the rail to enable the engine to start depends on the volume of the system (defiition of therail, ength of the pipes, etc..The aim is to reach a pressure of 200 bars in 1. revolutions (rd compression).

•Maximum operating pressure: 1600 ± 150 bar

![](images/927c4cf624fa9b273dd655d099ffafefa5e8cfd4ef08d620d37c802f9f7335b8.webp)

![](images/84eeec46fae1bbcac2247fe30be380ecdba9509030141b3bd31a33f44214f84d.webp)

# Sectional View of HP Pump

![](images/3b22f1623419e7a9863f5e683433b97c200c89719862a6ae20fa3f99ec4a891e.webp)

![](images/961d599db1829de938409f62026adbc8a722ef798ab29ae3f252545afff25c03.webp)

![](images/d6e3d319ddbda418cbf1569edb0831270f4e321c01ab8461d4f043d8d7d4b0da.webp)

<Inlet Valve, Outlet Valve, Shoe and Roller, Temperature Sensor>

Y220_07034

![](images/ae4032e581984f58719b00c04d2f83d424a7c979ef5d2cd41a47f9fcdb1d16a8.webp)

Y220_07035

![](images/e0ac0199b91794769128fd645df5eb39306ee59293d628026f74451b6e291a84.webp)

# Removal

Preceding Works

-Disconnection of negative battery cable -Removal of engine cover

The trouble diagnosis should be performed before removing the HP pump. Refer to “Diagnosis” section.

1.Remove the bolts on the fan shroud. Disconnect the air intake duct from intake manifold and the coolant outlet port connecting hose.

# Notice

Plug the coolant port not to get the coolant into the engine. Add the coolant as required when installing.

![](images/b262a8612165976014bd4e6829ef8b28e4e474663f6a63b3628d0da1f02043a1.webp)

2. Remove the fan belt while pressing down the auto tensioner adjusting bolt.

3.Unscrew the center bolt and remove the cooling fan clutch while holding the pulley with counter holder (special tool).

![](images/69ddec28cedbf92e6a7cc3673ac0d13a8ed50803f39099f48193ae6af38cf9b1.webp)

4Remove the fan shroud and fan clutch simultaneously.

![](images/e8a3ac8686ae7c5d08ebb756e6311320328828e2ca8fd48f72a9a2d06f0afa16.webp)

5. Unscrew the bolts and remove the belt pulley while holding the belt pulley with a special tool.

![](images/e797a676292902483d7dd9ee3f9a8c6c8fc59509d40ccf57ec269b1d6083d234.webp)

![](images/dc382fdb8a574a99f60c9c66edb5feb5ba39cc9f1d7b791925216e0d81d7f6ce.webp)

6Unscrew the upper and lower bolts and remove the auto tensioner.

![](images/8ef8768acafe0937ae54802a237838e1cd5b99b65282e237ff9ebcf9f14b9aee.webp)

# To prevent oil leaks, store the removed auto tensioner in upright position.

7. Unscrew the bolts and remove the idle pulley.

![](images/a2c571b352371e820b124486a231ef18e4486b54080f5796bc1da9963c78f7c0.webp)

![](images/c069ab9c65632aafa27d010f930a139b7b3af5a77d0d3f49a4215308666b028b.webp)

Unscrew the bolts and remove the cooling fan bracket (timing chain cover side).

![](images/5152e48dbd450202af5e8f044519779855b8303b67d7f42edbf38c055b74d85e.webp)

![](images/9ba71f1ac1de265888161ec7c5ac9c808717117b89ff593811a6e3b8b1c8590c.webp)

![](images/e031c92494af7ba2d496662056361acd01e61ec560779f03fb0df32036983d14.webp)

![](images/d54887d8d5918f5e36f89410f8ec94a4f343bbb7ac5e6bd9d3f7cb1be9b312e7.webp)

![](images/ecba662ed1be2109bd4d982d723a97357d6b1933df0d677c054d462a44701eca.webp)

Remove the engine oil filler cap and adjust the mark on camshaft to TDC position.

10. Align the TDC mark on the crankshaft pulley to the guide pin and rotate the pulley 720° counterclockwise. Check the mark on the camshaft again.

11. Disconnect the vacuum line of EGR vacuum modulator (1), the vacuum line of turbo charger vacuum modulator (2) vacuum line and connectors.

# Notice

Be careful not to be mixed the lines when installing.

12. Unscrew the bolts and remove the intake manifold mounting bracket.

- Upper bolts: 13M/ 2EA Lower boltes: 5M/ 2EA (Hexagon bolt)

![](images/c633f0b3962d7b49c463cd999bb78f77d6a6ca8cc150bb379cede8c8dcd5005a.webp)

13. Disconnect the connector behind HP pump, fuel pipes and hose lines.

1) Fuel temperature sensor connector (green)   
2) IMV connector   
3) Fuel return hose (be careful not to break the HP   
pump connecting port)   
4) Venturi hose

# Notice

Plug each opening with sealing cap.

14. Remove the coolant temperature sensor and the knock sensor.

![](images/b22d979e1d70b017c4a65cd61a877f9027f55fda5a7f37274e4fb279df4f4f63.webp)

15. Unscrew the bolts and remove the high fuel pressure pipes at HP pump and common rail. Plug the openings with sealing caps.

![](images/40cef9acad7e21a38d302f56185ac9394cffd7990980c18ba46d15d49ff669c9.webp)

# Notice

Replace the fuel pipes with new ones.

![](images/5bbab56ce50ce8e751716e22e25edd15d2c271fbfd57c0871c1d8d38ad070bf0.webp)

![](images/1b0f6c652db5e32e6ec3fb856892964420e74700d460337a89a37c7614ee1d8f.webp)

16.Remove the HP pump mounting bracket at engine.

![](images/88de55182489c6c458b05242bc7f89f3df9ecb1a74074279f3264709cd1d1521.webp)

![](images/e09746801d875ca07f0b77ecf9b2987d0df2f31ed9270ca007aabb1023ef3256.webp)

![](images/453d1c6f88a857b90fc55cb65ad0bc52701a2ddc4f29a29b92984b8aba3d990e.webp)

![](images/e85b95e227349fb87d9fc20039b463898e43a35dc2385b4b8b162a7674e716b4.webp)

![](images/404d5abdd15aa6a874110838ab90e978c1e66528a97ea198467deecf83d604a2.webp)

![](images/134355230aa79bb224afe2b0c5a2a30baa810604676d25b79bc3f27655c7ac59.webp)

17. Remove the intake EGR pipe and gasket.

# Notice

•Replace the removed gasket with new one. • Replace the removed #1 and #3 pipes with new ones.

18. Disconnect the HFM sensor connector.

19.Loosen the clamp and separate the hose from air cleaner.

20. Separate the connection lines from turbo charger and PCV separator.

2.Remove the exhaust EGR pipe and gasket (Front side - 10 mm/ 2EA, Exhaust side - 13mm/ 2EA). Remove the center EGR pipe and mounting bolts (13mm/ 4EA).

# Notice

•Replace the removed gasket with new one. •Replace the removed #1 and #3 pipes with new ones.

22. Remove the oil dipstick mounting bracket and oil dipstick tube with O-ring.

![](images/69971f8fd069f88395fbe3814f66f757d6aac62b1ab105057c97db0cf0998e4e.webp)

# Notice

Replace the O-ring with new one.

23.Remove the chain tensioner.

24. Mark on the HP pump sprocket and timing chain.

![](images/123e0b16583e41abe1c5642eb27c630f02a6cbef72dc64e6ad3e053e4b465a55.webp)

![](images/c21a93a97a8bcc245aa480a1fb16c50672ca66793ac9b64d1d47eb2ffff3fec9.webp)

![](images/02751c9fcfe450101ffe30a542a3fe869cc3a7c2d46fba358342e35202f47221.webp)

![](images/e36ba542ff722ac43946c1ce854cf4458a4dfad72d8639c5cfa179864dbb9a63.webp)

![](images/7dfc8a7a547fc371afeee24ce55ed6af9688918516948817cb57dfb5abd7238d.webp)

25Remove the guide rail pins (lower and upper) with a special tool.

26 Install the special tool (1) for holding HP pump sprocket, unscrew the mounting bolts and remove the sprocket. At this time, rotate the crankshaft 30° to 45° counterclockwise to remove the sprocket.

![](images/a088187605a2851c47f6cde9c35f9403aa673f1f49be634e75e0eff713610adc.webp)

27.Remove the center nut for HP pump shaft.

![](images/712da00ea15a5fa50260fcf5a424db02bdcfc324730fb94627a13a6ffa155e6f.webp)

28. Pull out the HP pump bearing with a special tool.

# Notice

Be careful not to damage the bearing.

29.Remove the HP pump bearing bracket (13mm - 3EA).

![](images/99bf5886ba4a4d4e8da57920efed87bbee4448b86810d26d09eb8e16304b3a61.webp)

30. Remove the mounting bracket behind the HP pump.   
31. Slide the HP pump out rearward while holding it.

![](images/da874ed45c505c55928899deaac033102c174f4338dd387406abf186ebe62243.webp)

# Notice

Plugs openings and put it in a box (for returns)

![](images/ba3b8db02e916359509dee5cc4df59d5b450a307dee0f4065448b5ceca402509.webp)

![](images/3e44f08988129341040bc7a28bb9b35ef8431963ae6ca1a3e2795dac358760e1.webp)

Y220_07064

1.HP pump sprocket   
2. 12-sided bolt (20 Nm + 90°)   
3. HP pump bearing housing   
4. HP pump (High pressure pump)   
5. HP pump shaft   
6. HP pump center nut (65 ± 5 Nm)   
7. HP pump external bolt (24 ± 2.4 Nm)   
8. HP pump bearing shaft   
9. Oil gallery   
10. Bearing bushing   
11. Gasket

![](images/8a055248332e523cb88611f5bd9a359c2f54bfd80a827e22c3e1a44caa454dfd.webp)

# Installation

Install the gasket and HP pump.

Notice

Replace the removed gasket with new one.

Warning

Remove caps at last minute and always change removed HP pipes.

Install the HP pump bearing bracket and HP pump to the cylinder block.

![](images/96d29e892df9cf9cf74d1e089e18f542afffc775cc4f15e8ae2293d198ef438d.webp)

# Align the oil galleries in cylinder block and bearing bracket.

Install the bearing into the bracket.

4Temporarily install the upper and lower guide rails to seat the chain. 5Temporarily tighten the center nut for HP pump shaft.

# Notice

Be careful not to rotate the shaft.

![](images/1c07ea89f128c91f2d69cde00dbd3a9d99796c52ff5199f283300a5b83db18c3.webp)

6. Install the timing chain on the sprocket and lock the sprocket with a special tool.

# Notice

Do not apply excessive force to the timing chain. Otherwise, the TDC point deviates from correct position.

![](images/048080e5995e87af3d651383cf61a09e3fefd2702b592fededbe0961697b9500.webp)

![](images/ace146a24c3deea7389f71a717e2bc757a0e3aecc040eac53623a3c102f3244f.webp)

![](images/ae083b16b1c0d2ebae7991e38305805dd8a1dc20f17d36725459a4f12a7f10b4.webp)

![](images/69d08a59b6e25e02cbb0be3cb8d0626f8464d72f49f56264b173c3bf2ad6c7dd.webp)

7. Tighten the center nut for HP pump.

![](images/bbf59b48359c3bc52bb28b63039eb497e1e779f49c631b1c70dfc879fbe95918.webp)

# Notice

Replace the center nut with new one.

8. Press the upper and lower guide pins into the guide.

# Check the timing chain and guide pin for contact.

9. Align the marks on the HP pump sprocket and the timing chain and tighten the bolts.

![](images/5b628b2443698225ff3a7e04f316f38f58c8a87e7c70394cf507e958d50e3f00.webp)

10Remove the special tool.

11. Install the mounting bracket behind HP pump.

![](images/7c634bb52046bd698c95e9c4b0c32a6615a6325b5a7c3422a46a6e0301574543.webp)

12 Install the chain tensioner.

![](images/f7ac64e2950890f3a4ecb7606336de6b9298621673375b2d1c7b1100954bb1b1.webp)

# Notice

•Replace the chain tensioner washer with new one.   
•Be careful not to drop the washer into the hole.

13.Check if the mark on the intake camshaft is at the correct position through oil fller opening.

# Notice

Rotate the bolt on crankshaft damper pulley two revolutions and check if the mark on the intake camshaft is at the correct position.

![](images/daee102d10c99835c04d312419b92401ade2a2de8dade83011c1ecd476c8c9d7.webp)

14. Clean the timing chain cover parting surface and apply the sealant on it.

![](images/7d9fc9ca20e9bdc4607174caebdafad89871409b11a25e82376f1e46a25fe5df.webp)

1 Install the timing chain cover.

# Align the cover and the guide pin.

![](images/17cbd4822d6a906dffd1bf2139375c09770bc87b8a34fb9cdc66cd19db04d1e2.webp)

16. Install the auto tensioner assembly.

- Upper bolt (24M):

![](images/93ff06f29c5c231a4b69fa0ddbf8da4340ed4f6802447dcecb6a1929e6392712.webp)

![](images/92f9e95afe30bf36ed6b1b262cdd64953734e5a75ffee88c182fef6e8edc81bf.webp)

![](images/73a8afc49d6b3a14aa10f8a1d70617bdb5227afe6d4e967497b134d7b8ffb364.webp)

![](images/504f5f6eb977a76cb309983f6a5033305311a1190aef9f13bdbf0718400289ac.webp)

# Notice

If the initialization of fuel pressure has not been performed, the engine ECU controls new HP pump with the stored offset value. This may cause the poor engine output.

17. Install the coolant pump pulley.

![](images/f9e680beb9bee7a12d3be28e375b1d0806155563f4514d1756281be4ea673901.webp)

18 Install the fan clutch with a special tool.

![](images/698916986d0843211ee962ec7f5d7616ff6a49c37ca2f50d5924051c85262010.webp)

19. Install the oil dipstick tube and bracket.

![](images/5687b52a9c93b0f597a0cd94d31e2c99ef4e157c3b5493b8b5534177da35902a.webp)

20. Install the exhaust EGR pipe and bracket.

![](images/3e8169d2c6539cbeb771aa6f9ca23aef4af5066510c4f3b010a81e2aef86ff1e.webp)

# Notice

Make sure that the convex surface of new steel gasket is facing the direction as shown in the figure.

Gasket Installing direction

2Engage the turbo charger and PCV separator connecting lines.

22Engage the air cleaner hose and tighten the clamp.

23.Connect the HFM sensor connector.

24. Install the EGR center pipe.

![](images/4e86df5f7e6b729629405d9f83fc45188fa9dc88eb06ac2c2675c47dd758d039.webp)

2Connect the HP pump connectors and engage the hose lines.

-Fuel temperature sensor connectors and IMV connector - Venturi hose and fuel return hose

26. Install the coolant temperature sensor and the knock sensor.

27.When replaced the HP pump, initialize the fuel pressure by using Scan-i. Refer to “Trouble Diagnosis” section in this manual.

![](images/b88389feea2d9872988b71783cef6292af91585f7609fd41247f1927206a2d56.webp)

27. Install the vacuum modulator to the intake manifold bracket.

28. Connect the vacuum modulator connecting lines and connector.

(1Vacuum modulator for turbo charger control (Vacuum modulator for EGR valve control

# Notice

Ensure that the vacuum hoses are connected to correct positions.

29. Connect the hose to coolant outlet port and tighten the clamp.

30. Install the air intake duct.

31. Install the fan belt while pressing the auto tensioner adjusting bolt.

![](images/fbd92e5ce4aaa13da333b54f53a1305011e19af6db9d6187a70e8b2d5e918933.webp)

32 Place the fan shroud in its location and install he cooling fan by using an open end wrench.

![](images/cc0aa20f9559967d41009f7eb9ced481dff908f7df96b0ee1e17ec9c9c966b8f.webp)

33. Install the fan shroud.

34. Add the coolant.

35. Check all the connections for tightness and pump the priming pump to deliver the fuel to the transfer line of HP pump.

36Start the engine and check if abnormality is present.

37. Run leak detection cycle to get rid of air in the system using scan 100.

![](images/e3f780e51518347f0546e6d2346ac71ce147d9276e54bb78782583491ed83a7f.webp)

# Fuel Filter

Foreign materials in fuel can damage the pump components, transfer valve and injectors. Therefore, the high pressure direct injection engine must use fuel filter. Otherwise, the operation performance will drop dramatically And, diesel fuel may contain water due to condensation by temperature changes and this condensation water can damage the system by corroding the injection system. Thus, the common rail engine should have function that can drain water periodically.

![](images/0982c8ec90e0e63fe094a3c2753c46593584724509f5ebd6c56c39fd72994bc4.webp)

![](images/9e3357332c81df72cf4f176cf87ac1ae42b25c077db4467d216ce1d65f7e31c3.webp)

# Water separation and storage function

Function: It separates the condensation water from diesel fuel to prevent the water from getting into FlE system, and results in protection of FIE system. (manual drain)   
•Water storage capacity: 120 cc   
Water sensor: light if over 39 cc   
Water drain interval: When changing engine oil or every 20,000 km

# Water sensor

tis integrated in the filter and sends signal to ECU when water level reaches at a specified value (over 39 cc) i the filter :o let the driver drain the water.

# Fuel De-Waxing – Improving starting performance in cold weather

Due to characteristics of diesel fuel, some of fuel components solidify during cold winter under below a specific temperature (15°C). When those symptoms happen, engine may stall however, some of the fuel (temperature rises due to high compression) in the HP pump in D27DT engine returnto the filter to warm up fuel when temperature is below 50°C by improving cold start performance during cold winter.

![](images/1b970e1ab259b51d56dac4872116f18c097a93670e800b3749c0917f0e292c51.webp)

![](images/dafa7fa1d26bc25823e17a9efa9be0179ff76a668ee573f4e3e1c71b0678c81c.webp)

![](images/a4e4a0b3bd7dfc107bef28cc28802cbf211a6abeeefc009d641065a26813baac.webp)

# Removal and Installation

1.Disconnect the fuel supply and return hoses.

# Notice

• Plug the openings of hoses and fuel filter with sealing caps.   
• Ensure that the hoses are connected to correct positions.   
2. Loosen the bracket bolts and disconnect the hose from the drain plug.   
Remove the fuel filter.   
Install in the reverse order of removal.   
5Press the priming pump until it becomes rigid to deliver the fuel to the transfer line of HP pump.

![](images/3005ebdb6a681fd2b09d20fe55843c81b15a13b4882f7713c41f163279618f5e.webp)

# Priming Pump

If fuel runs out during driving or air gets into fuel line after fuel filter replacement, it may cause poor engine starting or damage to each component. Therefore, the hand priming pump is installed to fill filter.

When the vehicle is under the conditions as below, press the priming pump until t becomes rigid before starting the engine.

Conditions for using Priming Pump -  After run out of fuel -After draining the water from fuel filter -After replacing the fuel filter

![](images/02cd81f5f1ac03ea91e2a056d136544f16dc873a89db247ae5dfab87724537d1.webp)

# Notice

When the fuel filter is replaced, the fuel in the fuel tank should be transferred to the filter by using priming pump. So never transfer the fuelin the fuel tank to the fiter by driving HP pump with cranking the engine.

# б Relations Between Pressure and Temperature In Fuel Transfer Line

![](images/813a18c6e088d7934c2df98a667f8943e10d060d69e19800430f56b13831059e.webp)

Y220_07087

The fuel transfer line is the line between fuel tank and HP pump inlet port. The pressure on this line affects the lifetime of fuel filter.

•Temperature of fuel transfer line

- HP pump inlet temperature is less than 80°C.   
- The temperature of fuel pump inlet is up to 80°C. And, diesel fuel has lubrication effects due to its viscosity. Thus, the fuel is also used for pump lubrication. However, this lubrication performance drops as the temperature rises. Accordingly, when the fuel temperature is over 50°C, 100% of fuel is returned to fuel tank to cool down the temperature and then increase the lubrication effects of fuel and prevent heat damage on each section of high fuel pressure line.

![](images/5f548829934217f53db465791ae8be23f3d378a19504d0a4c7a375f740296198.webp)

# High Pressure Accumulator (Common Rail)

Y220_07088

# Description

The high pressure accumulator reserves the high pressure fuel. Simultaneously, the pressure changes due to the delivery from HP pump and the fuel ijection is diminished by rail volume. This high pressure accumulatoris commonly used in all cylinders. Even when a large amount of fuel leaks, the common rail maintains its internal pressure. This ensures that the injection pressure can be maintained from when the injector opens.

# Function

Relieve the pressure pulsation •Provide pressure information to ECU (fuel pressure sensor)

# Specifications

Material: Forged Steel   
Dimension: - Volume: 22 ± 1cc - Length: Max. 397.7 mm - Outer diameter: 25.3 mm   
•Fuel pressure sensor Integrated type - Sensor input voltage: 5 ± 0.1V - Sensor output signal voltage: - 4.055 ± 0.125 V @ 1600 ± 15 bar - 0.5 ± 0.04 V @ 0 bar   
• Operating pressure range - Normal condition: 0 \~ 1600 bar - Max. Overpressure: 2100 bar   
•Ambient temperature: - available within -40°C \~ 125°C -Spontaneous max. temperature after engine stops: 140°C (acceptable against total 15 hours)   
•Fluid temperature: -40 \~ 100°C under normal operating conditions   
•Removal and installation: 10 times without any damage

![](images/c346cdfbf7ed93e66531a77727137a13a48aa5909969d576c4ec0b55c70fe031.webp)

![](images/b3f6f40e48f199820077b5fa06d73599292a2a005a629a5c241ec8d45492f1bb.webp)

Y220_07089

# High Fuel Pressure Pipe

Function: Resistant to pressure changes, tightness against surroundings, supplying fuel through pump, rail and injector with high pressure

•Material: Steel (Zn Plated)

Common: Cylinder 1 & 3, 2& 4,5

Internal pressure

- Internal operating pressure: 0 \~ 1600 bar during its lifetime   
- Spontaneous max. pressure when restoring: 2100 bar (max. total period: 20 hours)   
-Bursting pressure: over 2500 bar

To keep cleanness and tightness, the high pressure pipe assembly should be used only once.

# Notice

•Make sure to replace the removed high fuel pressure pipes.   
•Tighten the fasteners with the specified tightening torque.

![](images/3e08572936ad9598ae588c63363bdfdaaf32edce4aa426510afe57e6e21d31b3.webp)

![](images/b44ffd9f105f8217cb374c96fa75b28926325798c6629fb9fbad13dc74d45c26.webp)

# Removal and Installation

Preceding Work: Removal of engine cover

1. Disconnect the fuel pressure sensor connector.

# Notice

•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps. •Check pressure is low before opening the circuit.

Unscrew the nuts and remove the fuel supply main pipe from the fuel line.

Installation Notice   
![](images/4913cb4754f2339910009eb656d8379a9c4452c03af608f1166bdedb6aca843a.webp)

# Notice

•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps.

3Unscrew the high fuel pressure line nuts and remove the fuel pipes.

Installation Notice   
![](images/7b2b0352075e9f45ebcd46850f82cd09fe3f1b5ddfe5ce6f3286a3edb9c0fd55.webp)

# Notice

•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps.

![](images/59b0092df2613fcff5588b8f0ecfb1d5d09893a5a3c2080ee4d3baf7b70716e3.webp)

4. Unscrew the bolts and remove the common rail asssembly.

Installation Notice

![](images/0bdfbd53a531a4dccca5b7c4ca6d24340e12243145c1d18effdce6c577d0125b.webp)

# Notice

•Replace the fuel pipes with new ones. •Plug the openings of hole in the common rail with sealing caps.

5 Install in the reverse order of removal.

![](images/648b19d1dd42bd15a53e5d93d39914e7a68dbcef403c8b2deebda3ca1f73dc0a.webp)

# Fuel Pressure Sensor

![](images/2d82062b7f3d9fb4062a0d0d8aa57869f2659c79f87814231e905853ab5e2111.webp)

-uel pressure sensor on the center of common rail detects instant fuel pressure changes and then sends to ECU. When 'eceived these signals, ECU uses them to control fuel volume and injection time.

The fuel inthe rail reaches to sensor diaphragm via blind hole in the pressure sensor and the pressure signal converts to electrical signal. The signal measured by sensor will be amplified to input to ECU.

his piezo element type sensor changes pressure into electrical signal. Accordingly, when the shape of diaphragn :hanges, electrical resistance in the layers on the diaphragm changes then can measure 0.5 \~ 5 V.

• Sensor input voltage: 5 ± 0.1 V   
•Output signal voltage of sensor - 4.055 ± 0.125 V: 1600 ± 15bar - 0.5 ± 0.04 V: 0 bar

![](images/24c52420c0170323f0496388e6c71561c12dd71d9378017f15465377ea84bd5b.webp)

![](images/3456dab214845fa17ab8ea5f33841183896d42805a52601a7e77765fed42d60e.webp)

![](images/3982882322e4a164d89ea0d9e7148f09ebce1eba06d2634a62375ad63a6d5822.webp)

![](images/9c382fde928d7df110d449ce52e0a1bc44c6eb272359a84104eb75f2460d8dd8.webp)

![](images/5f24e7901558a5ee8c51abc22432f5101cf30a772a92709995576a34795ccfdc.webp)

# Fuel Temperature Sensor

![](images/96898cee663d1123aef1088f87bf361f0e9716a6111d171611c02cff471039d9.webp)  
Y220_07098

Fuel temperature sensor is a NTC resistor that sends fuel temperature to ECU.

In case of NTC resistor, the resistance lowers if engine temperature rises so the ECU detects lowering signal voltages. Fuel temperature sensor is installed on the fuel return line to correct pressure after measuring fuel temperature. 5V is supplied to the sensor and voltage drop by temperature is delivered to ECU to measure the fuel temperature through analog-digital converter (ADC).

Notice

Fuel temp sensor not to be dismounted.

![](images/08d5ff941fb1f322388e18f390185d56e499988359a6b1224625a36ce9bfdb7a.webp)

Y220_07099

# HFM Sensor

- Refer to “Intake System”

Crankshaft Position Sensor -Refer to “Engine Assembly”

Knock Sensor -Refer to “Engine Assembly”

Camshaft Position Sensor -Refer to “Engine Assembly”

![](images/d9f63771942ce26146e27b1fbd615e5b4460529569800a0ea6149a923b512fa6.webp)

# INJECTOR

The C21 labels including injector characteristics are attached in each injector. These C21 values should be input to ECL by using Scan-i when replacing the ECU or injectors.

Special cautions:

1. Plug the openings of hoses and pipes with the sealing caps.   
Replace the copper washer with new one plus injector holder bolt & washer.   
3Tighten the injector holder bolts with the specified tightening torque.   
4Be careful not to drop the injector.

![](images/fe19c0257d6e222a1e21796e53fa163f3b4ea8cd18e95370258cae1df7f4428a.webp)

![](images/c88d21769dd81759754babbe73dbf4fc6ccf2c8fcaadb5b097448dae90f0c2f2.webp)

The maximum injection pressures are approximately 1,600 bar. The forces to be overcome in order to lift the needle of the ijector are therefore very large. Because of this, it  impossible to directly control the injector by using an electromagnetic actuator, unless very high currents are used, which would be incompatible with the reaction times required for the multiple injections. The injector is therefore indirectly controlld by means of a valve controlling the pressurizing or discharging of the control chamber located above the needle:

When the needle is required to lift (at the start of injection): the valve is opened in order to discharge the control chamber into the back leak circuit.   
When the needle has to close (at the end of injection): the valve closes again so that pressure is re-established in the control chamber.

# Valve

In order to guarantee response time and minimum energy consumption:

•The valve must be as light as possible. The valve stroke must be as short as possible. The effort needed to move the valve must be minimal, which means that the valve must be in hydraulic equilibrium in the closed position.

Spring pressure ensures contact between the valve and its seat. To lift the valve, itis therefore required to overcome the force being applied by this spring.

# Spacer

The spacer is situated underneath the valve support. It integrates the control chamber and the three calibrated orifice which allow operation of the injector. These orifices are:

•The injector supply orifice (Nozzle Path Orifice: NPO) •The control chamber discharge orifice (Spill Orifice: SPO) The control chamber filing orifice (Inlet Orifice: INO)

![](images/4beb4a325c71eab3184132e670cc46d87e41f6a7247d9734000d7d2c10bdbc37.webp)

![](images/642ba4cda202e15a2e90dc59c83b476707fdd9a94ae6a3352c858f4798293367.webp)

![](images/39db4d31f4967767b8fc6b2a39557c77de6774b699aefb2b0a082ecc018035f1.webp)

# Principle of Operation

![](images/ea980fefd5c430e04d69fd5547dbc098081a866f6b18729c1ad5585e656ee8b3.webp)

![](images/e0ee9dc51572dc68d528217d9e296a377977381fc0451abe31f57d555f171f97.webp)

Y220_07103

# Injector at rest

The valve is closed. The control chamber is subject to the rail pressure.

The pressure force applied by the fuel onto the needle is:

The needle is closed and hence there is no fluid circulation through the NPO orifice. While static, the nozzle produces no pressure drop. The cone of the needle is therefore subject to the rail pressure. The force applied by the fuel to the needle is:

Since Ff > Fo, the needle is held in the closed position. There is no injection.

\* S: The area of the flat upper surface of the injector's needle \*A: The area of the needle surface situated above the section of contact between the needle and its seat \*Ff: The force applied by the fuel onto section “S" \* Fo:The force applied by the fuel onto section "A"

Y220_07104

![](images/c2489a2665d887c409e34d9de6c4ae8a6cd232082e9c8f9b86516a6c1a8ca4ba.webp)

# Solenoid valve control

When the solenoid valve is energized, the valve opens. The fuel contained in the control chamber is expelled through the discharge orifice known as the Spill Orifice (SPO).

As soon as Ff > Fo, the needle remains held against its seat and there is no injection.

# Start of injection

As soon as Ff < Fo, or in other words:

Pcontrol < Prail \* A/S

The neede lits and injection begins. As long as the valve is open, the injector's neede remains lifted. When injection begins, fuel cirulation is established to feed the injector.The passage of the fuel through the inet rifice of the ijector (similar to a nozzle) leads to a pressure drop which depends on the rail pressure.

When the rail pressure is atis highest (1600 bar), this pressure drop exceeds 100 bar. The pressure applied to the cone of the needle (the injection pressure) is therefore lower than the rail pressure.

# End of injection

As soon as the solenoid valve is de-energized, the valve closes and the control chamber is filed. Since the needle is open, the thrust section areas situated on either side of the needle is therefore to apply different pressures to each of these faces.The pressure in the control chamber cannot exceed the rail pressure, soi is therefore necessary to limit the pressure applied to the needle's cone. This pressure limitation is achieved by the NPO orifice which produces a pressure drop when fuel is passing through it.

Prail \* S ≥ (Prail - ∆ P) \* S

When static, this pressure drop is zero. When the pressure in the control chamber becomes higher than the pressure applied to the needle's cone, the injection stops.

![](images/ca326e0844434090afae9d9d4a88ce44efe9cc11d7719de7e7fdabc0a51d0bc8.webp)

# Injecting Process

![](images/97d60cfd10e92f552814fc6997cebb24b707757d21fe4b01e84b38d72ef89b3a.webp)![](images/666d29e78b3ead096acfb34ed3e2fc7c865f6dc20c6cdd3827f439cf43f27400.webp)

![](images/6829ff495e00837cac66bd87cc0ca8a8f47bf1b7fd5da403718d46586dc2d9b5.webp)

![](images/6203a694d4eea4d6e3aa7717ec415c6da1a4ecea9bbe0fc5ac4f890384a9aa56.webp)![](images/edce2bc82e6e4dae2046473b03cb8c507c5ec127c37d1900277db06b5131e317.webp)

![](images/52275bdd185a77a9ecde8479337c29a0f9672fbf8f62e4b1b246ec5e33bb3d42.webp)

![](images/74bffa8c2ceda181f324f8e9de6fe477a6fa821038a9bb09a11374f07c8295c2.webp)![](images/1f042df26a34ced8301946750804784880523196c7e83fb62b905f18cc6f3eaa.webp)

![](images/60082ccb8ca023ff6177f311e3a643e13c24832404d5b3d4f0ddde371e17f02f.webp)

![](images/9eb80f46b7b1884431d2131f8d6a6d3bbcf0b00bbbf3df3256e4c5e4455f25cb.webp)![](images/299c1416ee2be654dce96f361f35c4f304e0b829260231c616c88fc987aae4f5.webp)

![](images/b462f548361f472198790c420b8266b06f7adf218e7ac433a59082a739be2499.webp)

![](images/0c9422087350200d5cefbd10cb8e38fd188aa92804e890241d1fec75d38d4493.webp)

![](images/5c708519cf1bdbdc3cc4105f1d056bdd99a99752d28025effaf2a3c4c5c99c71.webp)

![](images/cc12e19138346d590184310ea0dcf4720730e380ab38b2d3c9843d037072b4fe.webp)

# Fuel pressure

•Minimum operating pressure: start injection over 100 bar   
•Maximum operating pressure: 1,600 bar (max. operating pressure in normal conditions)   
•Max overpressure: 2,100 bar

# Maximum fuel volume at each injector cycle

Pilot Injection ≤ 5 mm3 Main Injection ≤ 85 mm3 (within 200 \~ 1,600 bar)

![](images/fc34974ee6eed358dbbfd5bd7f1ef0976d7acd043b09bd1c2fa4135d9b22ba74.webp)

Y220_07110

•Small injection separation: min. 200μs (duration between the end of pilot injection and start of main injection)   
•Opening Delay   
: Delayed time from applying operating voltage to start of injection   
•Adjustment of feedback injection volume: C2I

![](images/4ae2ba367332bc76c8f595b1da89bed5c6b63875d8b7b16c5cd2a674ea3a1712.webp)

![](images/c54cc959b21e38b9af3c8c2f3bb45470af5cc0d7942ac3ee9e06e29f75ed101a.webp)

# Injector control

![](images/4a9252dbcf151b6626a117a5cdc5a43d255d0dedba248e9a96c80a59b572f502.webp)

Y220_07112

The control current of the coil takes the following form:

The low current allows the Joule effect losses in the ECU and injector to be reduced.The callcurrent is higher than the 1old current because during the hold phase.

The air gap between the valve and the coil is reduced and the electromagnetic force to be applied to the valve ca thus be reduced. It is no longer necessary to overcome the valve inertia.

# Note

Joule Effect: The principle that the heat produced by an electric curent is equal to the product of the resistance of the conductor, the square of the current, and the time for which it flows. I: current (A) R: resistance (2) T: time (sec) H: calori (cal)   
Heat capacity (H) = 0.24 I²RT

![](images/136c9b5cd0f0ae8c7c48c23156b2874f7de7c24cd95191dca880b17600d135db.webp)

# Fuel Injection

Other than conventional diesel engine, common diesel engine use two steps injection as follows:

Pilot Injection •Main Injection

In above two step injection, the fuel injection volume and injection timing is calibrated according to fuel pressure and fue temperature.

# Pilot injection

3efore starting main injection, a small amount of fuel is injected to help proper combustion. This injection is for reducing he engine noise and vibration.

In other words, i makes the pressure increase in combustion chamber during combustion smooth to reduce the engine noise and vibration (suppressing the surging). Basic values for pilot injection are adjusted according to the coolant temperature and intake air pressure.

![](images/2727916bb3bb3f802f6e1bb7e4d5bac455ebe055588fddea6c74e104c647da99.webp)

# Main injection

Actual output from engine is achieved by main injection.

The main injection determines the pilot injection has been occurred,then calculates the injection volume. Accelerator pedal sensor, engine rpm, coolant temperature, intake air temperature and atmospheric pressure are basic date to calculate the fuel injection volume in main injection.

![](images/d655977ebfb0089b158beab0cf01e732005a6900a5cfdcbdc3932aa5cd9adfcc.webp)

1. Pilot injection   
2. Main injection   
1a. Ignition pressure with pilot injection   
2a. Ignition pressure without pilot injection

<Characteristic curve of combustion chamber pressure during pilot injection>

Y220_07114

![](images/5a207be7760511a6a34c85f7ecc0ab92bece4f5786fc72178884332f5124d892.webp)

![](images/25ff3bd9aac6fde4a3e03668c9376ed48ccf2d04dc68089937da973c04ed5c86.webp)

![](images/0b9be467ffc385b1411a1e0a0ab80c46edfc362c5ea27091c5e945df2316f323.webp)

![](images/5a7b3f62f43f70ccb26ebf0566ed16da52f789d7f9d8e8956b6b5918e9e8f25f.webp)

# Removal and Installation

Preceding Work: Removal of engine cover

1. Disconnect the injector return hose.

Notice Plug the openings with sealing caps.

Remove the relevant connector for the injector.

Unscrew the bolts and remove the fuel pipes.

# Installation Notice

![](images/397ff53d0b942b552da92121664a82ff3692273c4f6d985ff641fff986c55cea.webp)

# Installation Notice

•Replace the fuel pipes with new ones. • Plug the openings of the common rail with sealing caps.

Unscrew the injector holder bolts.

# Installation Notice

![](images/78b1d3af330833d4a8500dfb6e6ba807888cca66d5a78c297476715c825001fd.webp)

Replace the bolts and washer with new ones.

Disconnect the injector holder.

6Remove the injectors with a special tool.

# Notice

•Plug the openings of the injectors with sealing caps. •Pullthe dropped washer out from the engine with a special tool. •Clean carbon deposite in hole with specific tool.

7. Install in the reverse order of removal.

8 Do not forget to update C2l with Scan 100 and cross old C2I on label fited on engine.

# Notice

Replace the copper washer, holder bolts and washer and fuel supply pipes with new ones.

# ECU Wiring Diagram

2 п D H 1#о #10 # 2#10 V 2   
Sdd d 5 4 3 2 3 1 2 ε# #   
3 6 4 2 К х ON Wown or b П Ф V XX ) o 1 o 8 хх о0   
T N Jdis indno os 0o d (  ) H 0   
2 K 3 5 3 4 0 5 3 1 8 2 4 3 2 3 38 18 8 2 2 F 3 00 801 8 8 8 0 2 21 21 2 0 2 41 11 11 811 320   
п   
3 1 u 2 − 17 1 y 3 8   
ho (1 0 4 y   
40 \$ D   
3   
с 9 ++\$   
L 2 єз 1 8 х 2 + + L □ 4

![](images/e21478bdf4763b3b523113eab52d3b34c80f7a9c26d43015e0753ff77b0c87b3.webp)

![](images/3b4430a162989f6bac08def44ce20496df8c2cb4b131d0e1c60b7dbe79c55887.webp)

# SENSORS FOR DIAGNOSIS. ..083

Engine ECU and other components .. DI08-3   
Top view . DI08-4   
Side view . DI08-5

# ENGINE CONTROL SYSTE.. ... 86

ECU DI08-6   
Fuel pressure control DI08-12   
Fuel injecstion control. DI08-13   
Fuel flow control. DI08-14   
Individual injector calibration (C2I) DI08-19   
Minimum drive pulse (MDP) learning. DI08-21

![](images/81f27680d05643422d2c7668b3d09b2439fbe5e3ee796ba0e09b38314a74a3d9.webp)

# ENGINE ECU AND OTHER COMPONENTS

![](images/0304b0fecb41af94eb970c4e579cf1d03f2eb6fe0f6afbffc4852d7472af4510.webp)

![](images/c598d2b3e5e2df2d4e90dd7f891f63d75dc0894d1ee34130d80e0aa6433bc439.webp)

# TOP VIEW

![](images/05970e6f3a108ef2a40974fb1640f052db9068d5a65e3f7fc63d950177bed2a7.webp)

Y220_08002

![](images/fe23c3cb4b7ff7a414e77b71736e396c40e9993dc4e24bacab5cf8d1fd36aa61.webp)

# SIDE VIEW

![](images/576234c3cc119acc46896de5932d64bb625b84c00f8917ecf6c0bd53e88e4976.webp)

![](images/cadad59c77ef7d8099afad6ceb7e521f7d1b266ff0a197428fe28a7d0566240b.webp)

# ENGINE CONTROL SYSTEM

According to input signals from various sensors, engine ECU calculates driver's demand (position of the acceleratol pedal) and then controls overall operating performance of engine and vehicle on that time.

ECU receives signals from sensors through data line and then performs effective engine air-fuel ratio controls based on those signals.

Engine speed is measured by crankshaft speed (position) sensor and camshaft speed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal that generated by variable resistance changes in accelerator pedal sensor.

Air flow (hot film) sensor detects intake air volume and then transmits to ECU. Especiall, the engine ECU controls the air-fuel ratio by recognizing instant air volume changes through air low sensor to pursue low emission gases (EGR valve control). Furthermore, the ECU uses signals from coolant temperature and air temperature sensor, booster pressure sensor and atmospheric pressure sensor as compensation signal to respond to injection start and pilot injection set values and to various operations and variables.

![](images/04d36d7c80445bfa0870ddd8f9d512de3f96e0113d696a37cff793393040e740.webp)

![](images/cf1c2f72ac61b4ef15b7b534e3f101499053e7f263fafc174016f6d5fda7406c.webp)

![](images/6f72a9e84d38b4d2456631d1daa31e90367140f704b340b5877cfbc348c39f85.webp)

![](images/6a23a026c247993cc98c3528050284cbd8d7573fc5a6b439c87f3eceb5ae6276.webp)

![](images/3ab40e9912197068dcaad7ed79af5eb3559b518d7e1e43906b015de28ca289cd.webp)

![](images/fb624df18a4fb12c0f2e4297949ec7e0830fd9819b1ef87fe44ebe4cbd0cfd45.webp)

# ECU IОРХФУбOХФРХФУ

Inputs Control Output Booster pressure sensor Atmospheric pressure sensor Injector (Built-in ECU) EGR system Air flow sensor (HFM) Fuel pressure regulating valve (IMV) Coolant temperature sensor Electrical fan control (Low/High-speed) Fuel temperature sensor E A/C compressor relay Fuel pressure sensor Glow plug relay Fnock sster sesor C Wanig ghts crankshaft position sensor (Water warning light, glow plug indicacamshaft position sensor U tor light, engine warning light) Accelerator sensor Preheater (auxiliary heater) Vehicle speed sensor K - line Switch input signal CAN communication (IG, brake, clutch, A/C signal, A/C Self-diagnosis compressor)

# Structure and Function of ECU

:CU receives and analyzes signals from various sensors and then modifies those signals into permissible voltage levels nd analyzes to control respective actuators.

ECU microprocessor calculates injection period and injection timing proper for engine piston speed and crankshaf angle based on input data and stored specific map to control the engine power and emission gas.

Output signal of the ECU microprocessor drives pressure control valve to control the rail pressure and activates injector solenoid valve to control the fuel injection period and injection timing; so controls various actuators in response to engine changes. Auxiliary function of ECU has adopted to reduce emission gas, improve fuel economy and enhance safety, comforts and conveniences. For example, there are EGR, booster pressure control, autocruise (export only) and immobilizer and adopted CAN communication to exchange data among electrical systems (automatic T/M and brake system) in the vehicle fluently. And Scanner can be used to diagnose vehicle status and defectives.

Dperating temperature range of ECU is normally-40  +85°C and protected from factors like il,water and electromag etism and there should be no mechanical shocks.

To control the fuel volume precisely under repeated injections, high current should be applied instantly so there is njector drive circuit in the ECU to generate necessary current during injector drive stages.

Current controlcicuit divides current applying time (injection time) into fullin-current-phase and hold-current-phase anc :hen the injectors should work very correctly under every working condition.

![](images/f0a293c1832b403556d9dee03f053b6f4b0455c1bc693a2b142f9c73bbdc7427.webp)

# Control Function of ECU

•Controls by operating stages

: To make optimum combustion under every operating stage, ECU should calculate proper injection volume ir each stage by considering various factors.

•Starting injection volume control

:During initial starting, injecting fuel volume will be calculated by function of temperature and engine cranking speed. Starting injection continues from when the ignition switch is turned to ignition position to til the engine reaches to allowable minimum speed.

Driving mode control

If the vehicle runs normall, fuel injection volume will be calculated by accelerator pedal travel and engine rpn and the drive map willbe used to match the drivers inputs with optimum engine power.

![](images/ed61873dfa8eb2a5b0cb774757dd95900e58494544650d9b0e36fdba225e4d86.webp)

# ECU - Removal and Installation

1. Flip up the front passenger's seat and remove the ECU cover nuts.   
2. Remove the ECU bracket nuts.

3. Unscrew the ECU connect bolt and remove the ECU assembly.

![](images/9b260ab476df9c96d06ac8c25addaf263e18b15b341cf01a69b19ce8662d8a79.webp)

4 Install in the reverse order of removal.

5. Backup the below data with Scan-i when replacing the ECU.

- Current ECU data   
-Vehicle Identification Number (VIN)   
-Variant coding data   
- Then, input the data into new ECU. For immobilizer equipped vehicle, additional coding operation is necessary.

![](images/28f63bc02280f92f0b8021c6a47a33de04ff691c9281ff53ce405d5d52a4dcb0.webp)

# Fuel Pressure Control Elements

Pressure control consists of 2 principle modules.

•Determines rail pressure according to engine operating conditions. Controls IMV to make the rail pressure to reach to the required value

Pressure in the fuel railis determined according to engine speed and load on the engine. The aim is to adapt th injection pressure to the engine's requirements.

•When engine speed and load are high   
The degree of turbulence is very great and the fuel can be injected at very high pressure in order to optimize combustion.   
•When engine speed and load are low :The degree of turbulence is low. Ifinjection pressure is to high, the nozzle's penetration wil be excessive and part of the fuel willbe sprayed directly onto the sides of the cylinder, causing incomplete combustion. So there occurs smoke and damages engine durability.

Fuel pressure is corrected according to air temperature, coolant temperature and atmospheric pressure and to take account of the added ignition time caused by cold running or by high altitude driving. A special pressure demand is necessary in order to obtain the aditional flow required during starts. This demand is determined according to injected fuel and coolant temperature.

# Fuel Pressure Control

Rail pressure is controlled by closed loop regulation of IMV. A mapping system – open loop — determines the current which needs to be sent to the actuator in order to obtain the flow demanded by the ECU. The closed loop wil correct the current value depending on the difference between the pressure demand and the pressure measured.

If the pressure is lower than the demand, current is reduced so that the fuel sent to the high pressure pump is increased.   
If the pressure is higher than the demand, current is increased so that the fuel sent to the high pressure pump is reduced.

![](images/01a638006dfd6dab95515e7e09ad7a63c8982b0cab229947276413916998805b.webp)

Y220_08008

![](images/74fc346240c9e92e549b2a92553b49b5be03cce7c8fa06b7bc4d9cc6352f51db.webp)

# FUEL INJECSTION CONTROL

Injection control is used in order to determine the characteristics of the pulse which is sent to the injectors.   
Injection control consists as below.   
Injection timing   
Injection volume   
Translating fuel injection timing and injection volume into values which can be interpreted by the injector driver. -a reference tooth (CTP) -the delay between this tooth and the start of the pulse (Toff) - the pulse time (Ton)

# Main injection timing control

The pulse necessary for the main injection is determined as a function of the engine speed and of the injected flow.

The elements are;

•A first correction is made according to the air and coolant temperatures. This correction makes it possible to adapt the timing to the operating temperature of the engine. When the engine is warm, the timing can be retarded to reduce the combustion temperature and poluting emissions (NOx). When the engine is cold, the timing advance must be sufficient to allow the combustion to begin correctly.   
•A second correction is made according to the atmospheric pressure. This corection is used to adapt thetiming advance as a function of the atmospheric pressure and therefore the altitude.   
•A third correction is made according to the coolant temperature and the time which has passed since starting. This correction allows the injection timing advance to be increased while the engine is warming up (initial 0 seconds). The purpose of this corection is to reduce the misfiring and instabilities which are liable to occur after a cold start.   
•A fourth correction is made according to the pressure error. This correction is used to reduce the injection timing advance when the pressure in the rail is higher than the pressure demand.   
•A fifth correction is made according to the rate of EGR.

This corection is used to corect the injection timing advance as a function of the rate of exhaust gas recirculation. When the EGR rate increases, the injection timing advance mustin fact be increased in order to compensate for the fall in termperature in the cylinder.

During starting, the injection timing must be retarded in order to position the start of combustion close to the TDC. To do this, special mapping is used to determine the injection timing advance as a function of the engine speed and of the water temperature. This requirement only concerns the starting phase, since once the engine has started the system must re-use the mapping and the corrections described previously.

# Pilot injection timing control

The pilot injection timing is determined as a function of the engine speed and of the total flow.

The elements are;

•A first correction is made according to the air and coolant temperatures. This correction allows the pilot injection timing to be adapted to the operating temperature of the engine.   
•A second correction is made according to the atmospheric pressure. This corection is used to adapt the pilot injection timing as a function of the atmospheric pressure and therefore the altitude.

During the starting phase, the pilot injection timing is determined as a function of the engine speed and of the coolani temperature.

![](images/dfc90a10759fa2f8ce6500ae1d788932186e549eba6754e27a8c49073ac594c1.webp)

# FUEL FLOW CONTROL

The main flow represents the amount of fuelijected into the clinder during the main injection. The pilot flow represents the amount of fuel injected during the pilot injection.

The total fuel injected during 1 cycle (main flow + pilot flow) is determined in the following manner.

: The driver's demand is compared with the value of the minimum flow determined by the idle speed controller.

When the driver depress the pedal, t is his demand which is taken into account by the system in order to determine the fuel injected.   
When the driver release the pedal, the idle speed controller takes over to determine the minimum fuel which must be injected into the cylinder to prevent the enigne from stalling.

It is therefore the greater of these 2 values which is retained by the system. This value is then compared with the lower flow limit determined by the ASR trajectory control system. As soon as the injected fuel becomes lower than the flow limit determined by the ASR trajectory control system, the antagonistic torque (engine brake) transmitted to the drive wheels exceeds the adherence capacity of the vehicle and there is therefore a risk of the drive wheels locking. The system thus chooses the greater of these 2 values (main flow & pilot flow) in order to prevent any loss of control of the vehicle during a sharp deceleration.

This value is then compared with the flow limit determined by the cruise control. As soon as the injected fuel becomes lower than the flowlimit determined by the cruise control, the vehicle's speed flls below the value required by the driver. The system therefore chooses the greater of these 2 values in order to maintain the speed at the required level.

This valve is then compared with the flowlimit determined by the flowlimitation strategy.This strategy allws the flow to be limited as a function of the operating conditions of the engine.The system therefore chooses the smallr of these 2 values in order to protect the engine. This value is then compared with the fuelimit determined by the ASR trajectory control system.

As soon as the injected fuel becomes higher than the fuel limit determined by the ASR trajectory control system, the engine torque transmitted to the wheels exceeds the adhesion capacity of the vehicle and there is a risk of the drive wheels skidding.The system therefore chooses the smaller of the two values in order to avoid any loss of control of the vehicle during accelerations.

The anti-oscilation strategy makes it possible to compensate for fluctuations in engine speed during ransient conditions. This strategy leads to a fuel correction which is added to the total fuel of each cylinder. The correction is determined before each injection as a function of the instantaneous engine speed.

A switch makes it possible to change over from the supercharge fuel to the total fuel according to the state of the engine •Until the stating phase has finished, the system uses the supercharged fuel. •Once the engine changes to normal operation, the system uses the total fuel

The main fuel is obtained by subtracting the pilot injection fuel from the total fuel.

A mapping determines the minimum fuel which can control an injector as a function of the rail pressure. As soon as the main fuel flls below this value, the fuel demand changes to O because in any case the injector is not capable of injecting the quantity demand.

![](images/875c05dae2c45a02919818ec17866bd0da88d74a88500fc6a970741a2aa45cee.webp)

![](images/8245528cdaedebe1d097095098e2406175318d032e1d52565fde9901617183ce.webp)

Y220_08009

# Driver Demand

The driver demand is the translation of the pedal position into the fuel demand. Itis calculated as a function of the pedal position and of the engine speed. The driver demand is fitered in order to limit the hesitations caused by rapid changes of the pedal position. A mapping determines the maximum fuel which can be injected as a function of the driver demand and the rail pressure. Since the flow is proportional t the ijection time and to the square rootof the injection pressure, it is necessary to limit the flow according to the pressure in order to avoid extending the injection for too long into the engine cycle. The system compares the driver demand with thi imit and chooses the smallr of the 2 values. The driver demand is then corrected according to the coolant temperature. This correction is added to the driver demand.

![](images/650a4b4e9c857cd9fed78fa94c8b07090a56492159214a4259ffc9ca89d2a08e.webp)

# Idle Speed Controller

The idle speed controller consists of 2 principal modules:

The first module determines the required idle speed according to:

-The operating conditions of the engine (coolant temperature, gear engaged)   
- Any activation of the electrical consumers (power steering, air conditioning, others)   
-The battery voltage   
-The presence of any faults liable to interface with the rail pressure control or the injection control. In this case, the accelerated idle speed is activated to prevent the engine from stallng when operating in degraded mode. - It is possible to increase or to reduce the required idle speed with the aid of the diagnostic tool.

The second module is responsible for providing closed loop control of the engine's idle speed by adapting th minimum fuel according to the difference between the required idle speed and the engine speed.

# Flow Limitation

The flowlimitation strategy is based on the following strategies:

•The flow limitation depending on the filing of the engine with air is determined acording to the engine speed and the air flow. This limitation allows smoke emissions to be reduced during stabilized running.   
The flow limitation depending on the atmospheric pressure is determined according to the engine speed and the atmospheric pressure. It allows smoke emissions to be reduced when driving at altitude.   
The full load flow curve is determined according to the gear engaged and the engine speed. I allows the maximum torque delivered by the engine to be limited.   
A performance limitation is introduced if faults liable to upset the rail pressure control or the injection control are detected by the system. In this case, and depending on the gravity of the fault, the system activates: - Reduced fuel logic 1: Guarantees 75 % of the performance without limiting the engine speed. -Reduced fuel logic 2: Guarantees 50 % of the performance with the engine speed limited to 3,000 rpm. - Reduce fuel logic 3: Limits the engine speed to 2,000 rpm.

The system chooses the lowest of all these values.

A correction depending on the coolant temperature is added to the flow limitation. This correction makes it possible to reduce the mechanical stresses while the engine is warming up. The correction is determined according to the coolant temperature, the engine speed and the time which has passed since starting.

# Superchager Flow Demand

The supercharge flow is calculated according to the engine speed and the coolant temperature. A correction depending on the air temperature and the atmospheric pressure is made in order to increase the supercharge flow during cold starts. It is possible to alter the supercharge flow value by adding a flow offset with the aid of the diagnostic tool.

# Pilot flow control

The pilot flow represents the amount of fuel ijected into the cylinder during the pilot ijection.This amount is determinec according to the engine speed and the total flow.

•A first correction is made according to the air and water temperature. This corection alows the pilot flow to be adapted to the operating temperature of the engine. When the engine is warm, the ignition time decreases because the end-of-compression temperature is higher. The pilot flow can therefore be reduced because there is obviously less combustion noise when the engine is warm.   
A second correction is made according to the atmospheric pressure.   
This corection is used to adapt the pilot flow according to the atmospheric pressure and therefore the altitude.   
During starting, the pilot flow is determined on the basis of the engine speed and the coolant temperature.

![](images/607451ab4adf93848a2b388ea4b5d75b95716f70cc6f70fb1daa25186ddd870e.webp)

# Balancing of the point to point flows

The pulse of each injector is corrected according to the difference in instantaneous speed measured between 2 succes.   
sive injectors.   
• The instantaneous speeds on two successive injections are first calculated.   
•The difference between these two instantaneous speeds is then calculated.   
Finally, the time to be added to the main injection pulse for the different injectors is determined. For each injector, this time is calculated according to the initial ofset of the injector and the instantaneous speed difference.

# Detection of an injector which has stuck closed

The cylinder balancing strategy also allows the detection of an injector which has stuck closed.The diference in instantaneous speed between 2 successive ijections then exceeds a predefined treshold. In this case, a fault is signaled by the system.

# Resetting the pilot injection

The accelerometer is used to reset the pilot injection flow in closed loop for each injector. This method allows the correction of any injector deviations over a period of time. The principle of use of the accelerometer is based on the detection of the combustion noises.

The sensor is positioned in such a way as to receive the maximum signal for all the cylinders. The raw signals from the accelerometer are processed to obtain a variable which quantifies the intensity of the combustion. This variable, known as the ratio, consists of the ratio between the intensity of the background noise and the combustion noise.

A first window is used to establish the background noise level of the accelerometer signal for each cylinder. This window must therefore be positioned at a moment when there cannot be any combustion. The second window is used to measure the intensity of the pilot combustion. Its position is such that only the combustion noises produced by the pilot injection are measured.It is therefore placed just before the main injection.

The accelerometer does not allow any evaluation of the quantit injected. However, the pulse value wil be measured when the injector starts injection and this pulse value is called the MDP (Minimum Drive Pulse). On the basis of this information, it is possible to effciently correct the pilt flows.The pilt ijection resetting principle therefore consists of determining the MDP, in other words the pulse corresponding to the start of the increase in value of the ratio (increase of vibration due to fuel combustion).

![](images/82b733e24145b427527d04bb3e1780f933bf3029cb1c23cb7d334eca58bace22.webp)

![](images/3d1aa7e9c7730f5e95c2d4d22cdc4bfbc27489456dcc5f7d176beee2248b3dc1.webp)

This is done periodically under certain operating conditions. When the reseting is finished, the new minimum pulse value replaces the value obtained during the previous resetting. The first MDP value is provided by the C2I. Each resetting then allows the closed loop of the MDP to be updated according to the deviation of the injector.

# Detection of leaks in the cylinders

The accelerometer is also used to detect any injector which may have stuck open. The detection principle is based on monitoring the ratio. f there is a leak in the cylinder, the accumulated fuel selfignites as soon as the temperature and pressure conditions are favorable (high engine speed, high load and smalleak).

This combustion is set off at about 20 degrees before TDC and before main injection.

The ratio therefore increases considerably in the detection window. It is this increase which allows the leaks to be detected. The threshold beyond which a fault is signaled is a percentage of the maximum possible value of the ratio. Because of the severity of the recovery process (engine shut-down), the etection must be extremely robust.

An increase in the ratio can be the consequence of various causes:

Pilot injection too strong •Main combustion offset Fuel leak in the cylinder

If the ratio becomes too high, the strategy initiall restricts the pilot injection flow and retards the main injection. f the ratio remains high despite these interventions, this shows that a real leak is present, a fault is signaled and the engine is shut down.

# Detection of an accelerometer fault

This strategy permits the detection of a fault in the sensor or in the wiring loom connecting the sensor to the ECU. It is based on detection of the combustion. When the engine is idling, the detection window is set too low for the combustion caused by the main ijection. If the ratio increases, this shows that the accelerometer is working properly, but otherwise a fault is signaled to indicate a sensor failure. The recovery modes associated with this fault consist of inhibition of the pilot injection and discharge through the injectors.

![](images/9b25fabb66a9ab2f844cfb18f0a6e82a89cfeb5ea036f8a086e8ce866deb87a5.webp)

# INDIVIDUAL INJECTOR CALIBRATION (C2I)

Injected fuel is proportional to square root of injection time and rail pressure.

It is function between pulse and rail pressure and fuelinjection curve is called injector characteristis curve having the following shape.

![](images/6b8e4a5c40c1caa43443d828d2ef0e59eddb3dbc2fa31e5fb0836cca02df3fb0.webp)

Y220_08012

fommon rail njectors are very accurate components. They are able to inject fuel delivery between 0.5 to 100 mg/str inder pressure varying from 150 to 1600 bar.

This high level of accuracy requires very low machining tolerances (few zm).

Nevertheless, due to the machining dispersion, the loss of charge through the functional orifices, the friction between moving parts and electromagnetic field level are different from one injecto to the other. So, the difference of fuel delivery for the same pressure and the same pulse can reach 5 mg/str from one injector to the other.  is impossible to control eficiently the engine with such a dispersion between the different injectors. I is necessary to add a correction that allows injecting the demanded fuel delivery whatever the initial hydraulic characteristics of the injector is. The method consists in corecting the pulse that is applied to the injector with an offset that depends on the initial hydraulic map of the injector. So, the pulse should be corrected according to characteristics of each injector.

![](images/c1c046b011da0830a7a2915a92d2f4af01c4b57a39d9d366f7f907006fdabd7e.webp)

C2I is composed of models on these characteristics of injectors.

C2I consists of 16-digit; composed of numbers from 1 to 9 and alphabets from A to F. ECU remembers C2I, characteristics of each injector, to make the most optimal fuel injection.

When replacing the injector, C2I code on the top of new injector should be input into ECU because the ECU is remembering the injector's C2l value. If C2 is not input, engine power drops and occurs irregular combustion. When ECU is replaced, Cl code of every injector should be input. If not, cannot accelerate the vehicle even when the accelerator pedal is depressed.

![](images/3ee0e474f6b7401ee5d475185185b160f19e5b7b5a2dda0f53ab9d0e3067a69e.webp)

Y220_08013

![](images/c22e1f3f3c12447a00aa156331f13b5d10906035192e71a3a44b354997b88da3.webp)

# MINIMUM DRIVE PULSE (MDP) LEARNING

When the pulse value that the injector starts injection is measured, itis called mininum drive pulse (MDP). Through MDP controls, can correct pilot injectionseffectively. Pilot injection volume is very smal, 1 \~ 2 mm/str, so precise control of the injector can be difficlt fit gets old. So there needs MDP learning to control the very small volume precisely through learning according to getting older injectors.

# Learning Conditions

![](images/6de2f60be55e16d73309d37aad93124616823e1cf6318b96ea7625719b78888c.webp)

# Trouble Codes

![](images/efb3acf836d5d90977525a87d28ebfe49b386999023054883fd1f33f58083eba.webp)

![](images/a6b45f7b90c335ce71c6aae55d61cfa1dd4831e3c168db5fdaf56b3af26b17e6.webp)

# Accelerator Pedal Sensor

![](images/2650baa2e26980e171ae37cc77567252b552db4cb52c49b229d26013c97d4a0a.webp)

![](images/dc60776cf3e6041b84a02b23973259ee28013021b7e18796605e1bd9cda23fc4.webp)

# <When depressing the accelerator pedal and brake pedal simultaneously>

Y220_08014

Accelerator pedal sensor changes accelerator pedal position into electrical signal and then sends to ECU to let know the driver's demand. There are 2 sensors in the accelerator pedal sensor. Accelerator pedal No.1 (ACC 1) sensor signal determines fuelinjection volume and injection timing during driving, and accelerator pedal No. 2 (ACC ) sensor signal compares whether the No. 1 sensor signal value is correct.

If accelerator pedal No. 1 and 2 sensors are defective, ECU remembers defect code, and acceleration responses are getting bad and engine rpm hardly increases.

# Notice

When depressing the accelerator pedal and brake pedal simultaneously while driving, the acceleration response willbe diminished abruptly and cannot drive with over 70 km/h even though depressing the accelerator pedal to its end. At this time, the trouble code of “P-1124 Accelerator pedal sensor stuck” is stored into ECU. If depressing the accelerator pedal over 3 times, it will be resumed to normal condition.

\* For detailed information, refer to "Diagnosis" section in this manual.

![](images/da2e5260f1f4fdad19340d5db09d45b427778d9f303c5c42fbb01be92b67de7b.webp)  
<Circuit diagram of Accelerator pedal sensor>

![](images/c7f017a6dd5d4f6dd35cdb831b826ae6e3ecfd57f83e89ef79c2a47cc9a5dac2.webp)

# Coolant Temperature Sensor

![](images/9922d002a2f57b5d0a6d6259677c7a67c2d6ec911fe282b1825b7262766af4b6.webp)

Coolant temperature sensor is a NTC resister that sends coolant temperature to ECU.

NTC resister has characteristics that i the engine temperature rises, the resistance lowers so the ECU detects lowering signal voltages.

If the fuel jected into the engine through ijector has more turbulence, then combusts very well However, i engine temperature is too low, the fuel injected as foggy state forms big compounds causing incomplete combustion. So the sensor detects coolant temperature and changes coolant temperature changes into voltage then sends to ECU to increase the fuel volume during cold start for better starting. And detects engine overheating for fuel volume reduction to protect the engine.

ECU functions as below with coolant temperature sensor signals.

•When engine is cold, controls fuel volume to correct idle speed.   
•When engine is overheated, controls electrical fan and A/C compressor to protect the engine.   
•Sends information for emission control.

![](images/27011c7404cf4247c8435b14ac0a7dfedf4182beeaea927c453278cd057d3e79.webp)

![](images/551748b1ab0652487d30c8fa98ae5f5bcb4526793ef28aa40da38a371900d148.webp)

Y220_08017

![](images/9b3388de70447c838f2f6bb0dc4f9efea3fc88a2139bdeb21db86d4f63e75a5d.webp)

# Boost Pressure Sensor

![](images/52f17a3b53587f2ef2889e9723d3f7240052c62ce797e01492a46d590a026906.webp)

Y220_08018

Boost pressure sensor uses piezo element and uses only 3 terminals out of 6.   
It sets fuel injection timing and corrects fuel injection volume according to atmospheric pressure.   
The other function is determining EGR operation stops.

• Output voltage calculation V = Vs x(P x 0.004 - 0.04) Vo : Output voltage Vs : Supply voltage P : Applying voltage

![](images/6697f44f7579697a2fcf289d369d792dff639e2389d838b6ebd30c7840f2eae1.webp)

![](images/53477ea217191e471f9c5cbaf66dddaf2bb11f9a159d4e4a56429f1d0cb45d6b.webp)

![](images/464896dc28d82122ca47550caf1fe44a882517d98d7b9b57b6db0f56485f8651.webp)

![](images/2ed9a807d781610c72a32458f488aafee5cb59d4287a3c6127015e720c9e2468.webp)

Y220_08020

# Vehicle Speed Sensor

The ABS or ESP control unit sends the vehicle speed signals to ECU. ECU uses these signals to calculate the vehicle speed and meter cluster shows signals as vehicle speed.

# Function

-Limits idle control correction duty range - Controls cooling fan - Cuts fuel injection if exceeds max. speed -Controls vehicle shifting feeling - Used for exhaust gas control mode

![](images/a1481e83a7a5fba4e5a069d5e1ef9b9593b24c12a66c7a229951d148ddac547d.webp)

![](images/e3fb7f360dd3c6323827c86e91669bc4be8b3d06f4ee0cea84dff63ffd86954b.webp)

# Barometric Pressure Sensor

It is builtin the ECU and detects absolute pressure of atmosphere to correct fuel injection timing and injection volume according to altitude.

# Other switches

Brake switch detects brake pedal operations and then sends to engine ECU. It has dual structure with 2 combined switches and there are brake switch 1 and 2. When these 2 signals are input, engine ECU recognizes as normal brake signals. These switch signals are related with accelerator pedal sensor operations and used to control the fuel volume during braking. It means there are no problems in operating accelerator pedal when the brake pedalis operated but the fuel volume reduces if operates brake pedal while the accelerator pedal is depressed.

![](images/34ca181a5628766914332b762054cd827b4a86bcaeb16446b6350f0bb39ac9d2.webp)

Y220_08022

# Clutch pedal switch

Clutch pedal switch is installed on the upper of the clutch and sends clutch pedal operations to engine ECU. Contact type switch allws engine ECU to recognize the shifting points to correct the fuel volume. It means it corrects fluctuation happens during gear shifting. Another diffrent function is canceling auto cruise function if equipped (auto cruise control - equipped for export).

![](images/b31be5b6d052446fd896307016fb0dad04125726884454d960f1875c36d3141c.webp)

![](images/69eb1148b53ff83aa730bfc7a937c749e651ae893ff9e2e84131679fba902df9.webp)

SECTION DI09

# ELECTRIC DEVICES AND SENSORS .. 0-3

Sensors in engine compartment. DI09-3   
Electric devices in engine compartment . DI09-4   
Specifications . DI09-5   
Circuit diagram of preheating system.. DI09-6   
Circuit diagram of starting and alternator DI09-7

# TROUBLE DIAGNOSIS ... ... I09.8

General. DI09-8   
Alternator. DI09-10   
Starter .. DI09-12   
Preheating system . DI09-14   
Preheating time relay. DI09-16   
Glow plug . DI09-17

# SPECIAL TOOLS AND EQUIPMENT .. DI09-19

![](images/0b57f7f1e195a92095ba4cad831c7c9b4227797da8611bc8a353c6d7c8c4a35d.webp)

# SENSORS IN ENGINE COMPARTMENT

![](images/980b4d22f9c3283019c9be9d91514e07c30e8f15f529a7fd7feb5cb3963739bd.webp)

![](images/353254aa712747fc83d45543172338149d1ed1485351f40968b71fd33c815fc1.webp)

![](images/d26768b6e728f9ca6fcec30e51556f592c70b88fe99a1f305913d040304ac01f.webp)

![](images/76469d07d6a0e7d56137aac7e6772c4e34dbbd13e953c4302c71c3f1097af189.webp)

# SPECIFICATIONS

![](images/96e8e779e2113ff2e190061504284acf76da0d69fa8d9362b8292e1bb1201d90.webp)

![](images/2c1b3cb3db12bc0f910bd68317c1d614073fe6572b9bf696e491cb29370b5593.webp)

# CIRCUIT DIAGRAM OF PREHEATING SYSTEM

![](images/5e7cf858d89cf4ed9d9fba4c9744b8a499fcdf31b5c845fabe1312fe9b8d23dd.webp)

Y220_09003

![](images/8969f1441adad93d1908d39d7e58000c2daf17a6f4db313b10fe951b848ead4f.webp)

# CIRCUIT DIAGRAM OF STARTING AND ALTERNATOR

![](images/d052be361c269e0ca6f57013584a118d3c4b19f914a82de1b1577b7edcfd8a38.webp)

Y220_09004

![](images/a9f18bfafdd75d6699b6313e09a383c3a190522692155c14ed5d273c84e91c46.webp)

![](images/c0a2c3ee282c70a36e7c60e411307ccd1c3d44ee4d2eab9aa19be9480f10dce0.webp)

![](images/e8b5c73ca1b970639a68ed25522d89adfdebe260b3c13bd5de2bfd0e79a425f0.webp)

![](images/4d94e27700bd38a171d78a4b15db4526fdd924a4eafe359fa8cc0830d73b560b.webp)

![](images/b37d9114b75f2e41480cbfee9c5a2f2c90a46525906b1630c9e06e9dd33016e2.webp)

![](images/4cf7e555953f857635160994d2edd0a4c43653046f35ecbfeed8d38b7b1d67db.webp)

# ALTERNATOR

![](images/df887a1d3d827b85caeec32f71a8bc4664fc280c60165b9eb828ca83a10650d4.webp)

Y220_09005

1. Cooling fan 3. Alternator   
2. Bolt .. 45 Nm 4. Plug connection

![](images/64f414f46f3ad72a9d65a64b058d1bef9e94dbe5d094961cc13e3384ea2f67e0.webp)

# Removal and Installation

1. Disconnect the negative battery cable.   
Remove the plug connection.

3. Unscrew the bolts and remove the alternator. Installation Notice

![](images/63542487d6a5d7850224e4fae244d1ab9daf1bf724ef73322003f3a24c6899bd.webp)

4 Install in the reverse order of removal.

![](images/e72698bc3998ccfcf9f2c4ca1d1b3e2188226847c9ea8157a1adeec79a98e26b.webp)

![](images/11d8eafd059f378f0ad3afd1a4606ca1b3c9ecf60f99daabf378431326e45cf9.webp)

# STARTER

![](images/ceac442e9ccf9700243c06e75f6ace72442fdc485e8a460c784e716d644be12a.webp)

1. Starter   
2. Washer   
3. Nut .. . 15 Nm   
4. Bolt .. .48 Nm

![](images/8db87ed16076fdef3ac2027dce350627602592d7a0f19e879d515907a51b9ec5.webp)

# Removal and Installation

1. Disconnect the negative battery cable.   
2. Disconnect the starter terminal.

3. Lift up the vehicle and remove the front propeller shaft mounting bolts.

![](images/938ce599512c695c390ec1fc3ce11e6466160a5e38678d0a5dddb5912aa0f0d5.webp)

Remove the upper and lower mounting bolts.

5 Install in the reverse order of removal.

![](images/a54ae396272ea564c5f477a6201698b86e5aa3d5820a3638f636e1789dcea998.webp)

# PREHEATING SYSTEM

Glow plug is installed on the cylinder head (combustion chamber) in the D27DT preheating control unit system. Colc starting performance has improved and exhaust gas during cold starting has reduced.

ECU receives coolant temperature and engine speed to control; after monitoring the engine preheating/after heating anc glow plug diagnosis function, the fault contents will be delivered to ECU.

•Engine preheating/after heating functions   
•Preheating relay activation by ECU controls -Senses engine temperature and controls the preheating/after heating time -Preheating warning light   
•K-LINE for information exchanges between preheating unit and ECU - Transmits preheating unit self-diagnosis results to ECU -Transmits glow plug diagnosis results and operating status to ECU

![](images/aa2ee767e2a9ba4154d4d980e3519ff5225d85958660a550e55389c374548808.webp)

Y220_09012

![](images/e059bdcdb52668e54eb6fcab95d46d662d79f6ac4566eb2bc8ed7df6a957f445.webp)

# Function

Preheating system controls and checks following functions and operating conditions.

Pre-Heating

The power wil be supplied to the glow plugs by ECU controls when the power is supplied to the IG terminal from the batery and there are normal communications with ECU within 2 seconds. The surface of glow plug will be heated up to 850°C very quickly to aid combustion by vaporizing air-fuel mixture during compression stroke. Preheating time is controlled by ECU.

•While engine starting : Help to warm up engine

After-heating

When the engine is started, after-heating starts by ECU controls. The idle rpm wil be increased to reduce toxic smoke, pollutants and noises. After-heating time is controlled by ECU.

• Checking glow plugs

- Check each glow plug for short in circuit - Check each glow plug for open in circuit due to overvoltage - Check glow plug for short to ground

•Forceful relay shut-down - When glow plug is shorted to ground •K-Line communication

-ECU sends the results to preheating time control relay through K-Line to start communication.   
-Preheating time control relay sends messages including self-diagnosis data for glow plugs to ECU.   
- Glow plug makes communication only as response to demand.   
-  When power is supplied, ECU starts self-diagnosis within 2 seconds.   
-Under the following conditions, communication error occurs. When there is no response from glow plug module within 2 seconds When an error is detected in checksum Less byte is received Error code of “Pre heating control communication fail” will be reported.

![](images/6aa81007d3093f15c5b4b9b225b15e46b297b77fead6238a3080c27da6bc718f.webp)

# PREHEATING TIME RELAY

Structure

![](images/d3e27484ee809c20e8c07670aefe7f6b2d40ab212176ed393409c586931a3e10.webp)

Y220_09013

# Specifications

![](images/3994a2b221b7d496404ea816463b254b96faa1245103cfd704277a0c67192261.webp)

![](images/245ed87bbd392ca99e601132196fe0a4e4e13610f7c187de7614c3e8248e4738.webp)

# GLOW PLUG

Cylinder type glow plug is inserted into the cylinder and composed of heating pin and housing.

There are heating coil and control coil in the heating pin and those coils located inside of ceramic cover turn ON or OFF the internal switch.

# Purposes of use

-Preheating before engine starting -During engine starting -After-heating after engine starting

![](images/ace80714f31cfa3204a6f5fce0882dca5c01292d663028a81d91fb874ce5e653.webp)

# Conditions for glow plugs

-Prompt heating and secured temperature stabilities (temperature changes) in low operating voltage   
-Should not exceed permissible max. temperature under max. operating voltage   
-Heating pin should have good heat-resisting properties against combustion gas and durability   
-Material of the glow plug should meet high stressing conditions (e.g., temperature, vibration and environmental factors)

# Specifications

![](images/77ebd2ff39aeccefff62fffa3c98d41fb1553788b9a9c747c7779146fba91cfe.webp)

# Trouble Code

Refer to “Diagnosis” section in this manual.

![](images/78740033495e99657e32907bfe9dad32e8c6188ad47a1356a54bee609f0ab622.webp)

![](images/a7b39257df997bf6b9025e7112ae23ce2215f1cb88dfc8aa64381d301586820c.webp)

# Removal and Installation

1.Turn the ignition switch to “OFF” position and disconnect the negative battery cable. . Set aside the harnesses on the cylinder head.

3. Disconnect the glow plug connectors and loosen the glow plugs.

Installation Notice

![](images/740336d937717c5dbc98884b51f3eb6febb4cb0ef7e81e6c79b5061f84b409ea.webp)

4.Remove the glow plugs from the cylinder head with a special tool. Plug the openings of the glow plugs with sealing caps.

![](images/516e26ef467ee9d9353d0cb274cf4b176b31fa41b34baf55df5ddcef089830cb.webp)

# SPECIAL TOOLS AND EQUIPMENT

![](images/52a0dcc6de5c032e2f52f2845f74b87f1588a64f10fd8892707189ee8a946ab9.webp)

![](images/fb8545e64a8351fa957e37104e3387f2b89f790ee73e125e90e74467d66b934e.webp)

![](images/f6bf692dcdcbe49b05cc342908b7ad6b574e0986c86176dfeea25246ca8bc95a.webp)

# Table of Contents

SCAn- OPERATING PROCEDURES - XDi270 ENGINE ... 1103 TROUBLE DIAGNOSIS TABLE . DI10-23 FUEL SYSTEM DIAGNOSIS .. . DI10-177

![](images/55a12d7cc9427395f8574189521d6455464564df41a85650cbefb55b15b3af59.webp)

# SCAN-I OPERATING PROCE-DURES XDi270 ENGINE

ENTENG MIAGNOSMS PROCEDURES. DI10-4   
FUNCTION SELECTION .DI10-6   
Check the trouble code DI10-6   
Sensor data check. DI10-7   
Actuator check . DI10-8   
Trouble code clear. DI10-10   
ECU identification. DI10-12   
Injector coding (C2I) DI10-13   
Leak detection DI10-15   
Variant coding . DI10-16   
ECU replace . DI10-18

![](images/84f6712ed9aefe718f0c0e180b21e7b92a10c5c1c96639e34c99d666664b61e1.webp)

# SCAN-I OPERATING PROCEDURES - D27DT ENGINE

![](images/c408faa3c44d4d41b417004451399d947b3e7cb363515fe2eb960fd83c98160d.webp)

# ENTERING DIAGNOSIS PROCEDURES

1Select “1] DIAGNOSIS”" and press “EntER" in “MAIN MENU" screen.

![](images/1478a1df3e6194a36ea32702b43559028022028a6011e9983d53f752bb15506f.webp)

2. Select “5] REXTON" and press "EnTER" in "VEHICLE SELECTION" screen.

3. Select “1] ECU" and press “(EntER" in “CONTROL UNIT SELECTION” screen.

− SCAN - 100 CONTROL UNIT SELECTION   
REXTON ECU   
01] ECU 08] HUBER EGR   
02] TCU 0 SSPSs   
03] ABS 10 S LEVEER   
04] AIR-BAG 1 F   
05 TODD   
06] TCCU(PartTime)   
07] IMMOBILIZER Select one of the above items Y220_10003

![](images/4ed35ced74fa4431a0beadb2c46fa832d951e7d1891a5d167ccb3b49abb4c3aa.webp)

4. Select "4] XDi 270” and press "EntEr" in “MODEL SELECTION” screen.

![](images/93dfc8ddeb4a5fe545246127ec5e7bcb6ff42cb28e97f67aacff4640a6e3ffdd.webp)

5The “FUNCTION SELECTION” screen is displayed.

SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10005

![](images/0f1e49b7bc86bae44b60c7f991b6cf26e2768562e5599ca786387fd91115f364.webp)

![](images/37d0486e1a826e3a823746308611eca5bbf3e3254eecff847ead6007666314d3.webp)

# FUNCTION SELECTION

Check the Trouble Code

Preceding work: Perform the “Entering Diagnosis Procedures"

![](images/c43c61500328baf566b78839cb526f101c07fa948a0016dd848c57d06d83a01d.webp)

1. Select “1] TROUBLE CODE” and press “ENTER” in “FUNCTION SELECTION” screen.

Q SCAN - 100 02 DIAGNOSTIC TROUBLE CODES C=Current, H=History   
REXTON ECU DSL D27DT   
C-P1534. #2 Heater Driver Open Circuit   
C-P1530. #1 Heater Driver Open Circuit   
H-P0108. Boost Pressure Sensor Open Select one of the above items Y220_10008

2. The “DIAGNOSTIC TROUBLE CODEs” screen is displayed and it shows the trouble.

# Note

If there is not any fault, “NO TROUBLE DETECTED" message appears.

![](images/5f1fa6fd0fc7e46b8454f7810cd674a8ae146d9e0378fc07e76b2eceea68fe16.webp)

3. When selecting a trouble code, then

if you press "Ente": Displays the sensor data for the detected trouble (Freeze Frame Mode).   
if you press"“He":Displays the help tips for the detected trouble.

![](images/df58d45cdd3761c7276272fa7dd740f9cfea3262b9ccb1f54fdb425a7de2f496.webp)

# Sensor Data Check

Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/3bb77ea175401ea93287119c281f18d61e513ec14d7ce09a97dd1eb9a9a4f117.webp)

Y220_10010

1. Select "2] DATA LIST” and press “EntER" in “FUNCTION SELECTION” screen.

![](images/b83792071c726e8e7f82908eff6a72d649bb766f544ca5d20266952b2468bdea.webp)

2. The screen shows approx. 54 sensor data.

SCAN - 100 DATA LIST   
44. PTC Relay(#2).. OFF   
RUiSe FF SWitCh.... ON   
4Cruise Safty SWitch... OFF   
47Cruise Accel Switch... OFF   
48. Cruise Decel SWitch... OFF   
49. Cruise Resume Switch.. OFF   
50. Rear Blower Switch.... OFF   
5 Glow Plug Lamp.. OFF   
52Check Engine Lamp... OFF   
53. Fuel Filter Water In.. OFF   
Fix Un Fix Init.   
Itm Item Menu Y220_10012

3. Select the items you want to see and press to freeze them.

Note You can freeze up to 5 items (\*: selected items).

SCAN - 100 DATA LIST   
\*1. Fuel TemPeraTUre.... 26[°C]   
2 Engine Block Noise 1.. 0   
\*13. Engine Block Noise 2.. 0   
Ijcted Fuel Quanty.mg/stk]   
21EGR Demand(MAP)... 0.0[%]   
2 Idle Target RPM... 832[RPM]   
30 Engine State... Stopped   
Engine Run Inhibited.. YES   
Clutch Switch. OFF   
33. Brake Light Switch... OFF   
Fix Un Fix Init. Spec.   
Itemm It emm Menu Disp. Y220_10013

![](images/0f81562810488082af0cd8b04efaf3a9ed6654502138977f50f6d084367a52e8.webp)

![](images/09a8eedd97acf04fd6753e766195fda5e2bf34e45b96c38f22fd6e5f18030342.webp)

# Actuator Check

Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/fb0cdd848b07581b1b78a4a8efdb4ad0b3fb170a93c79c3db47efdf64a404304.webp)

1Select “3] ACTUATOR" and press “EntER)" in “FUNCTION SELECTION" screen.

2.The screen shows 14 items. Select the item you want to see and press "ENTER".

е SCAN - 100 ACTUATOR SELECTION   
REXTON ECU DSL D27DT   
01] EGR VALVE 09] GLOW PLUG LAMP   
02] GLOW PLUG 10] IMMO. LAMP   
03] IMV VALVE 11] A/C RELAY   
04] VGT VALVE 12] PTC RELAY(#2)   
05] FAN(LOW) 1 PTC RELAY(#1)   
06] FAN(HIGH) 14] FUEL FILTER   
07] POWER RELAY   
08] ENG CHECK LAMP Select one of the above items Y220_10016

![](images/3edda95a54f2d66808eb7a80b67acee8dfe4f8822c5931dd70525e04d23e2dd8.webp)

![](images/ccc56d98f6ce3f18921ec722270becb47c620fa48c883b51946823d7df0fbae0.webp)

3. For example, if you select “02] GLOW PLUG” item and press “Enter”, the screen as shown in figure is displayed.

4. If you want to operate the glow plug relay, press “res"” key. The “OPERATING” message appears and the relay operation alarm sounds.

![](images/5b193d520fe6922380fe79ba1206174bd04b5ad009d87f3057c8ba60c63ce442.webp)

f you want to stop the operation press""key in keyboard.

![](images/b2e706c66ceb9893454d3bc41f413f3d00c8f0b6e015a365f28fde08ae2916ea.webp)

![](images/70f89deeee6457fd2977de9ba02f797e93d1e8a5c6f1b46ba9878db06aa02e2f.webp)

![](images/4f064f01241d565dc7aa1560b64d5c32fb9bb0ccfbc5d6c01de2177e4e8c9050.webp)

# Trouble Code Clear

Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/72d94aac2115afd26a45b3d7bbf4d97ba3a481984698bd37eddea341ef19182d.webp)

1. Select “1] TROUBLE CODE" and press “EmE" in “FUNCTION SELECTION” screen.

![](images/ac708a8683b2038ac8916a9df4877817de9b6b6d8cc9714215d99662d4ce97e5.webp)

2. The “DIAGNOSTIC TROUBLE CODEs” screen is displayed and it shows the trouble.

Note C = Current trouble, H = History trouble

![](images/9c12a41ab193b096d19084036389b694421af0825fe2c13be8760b9ec1b59ee0.webp)

![](images/e0055380d5891ffc431972247a827a584a3d381cd042da4bdb7cc5ad9b521459.webp)

3. Fix the trouble and go back to “1] TROUBLE CODE" screen and check if the trouble has been changed to “H (History trouble code)” code.

4. If the trouble has been change to “H (History trouble code)" code, press « ESC key to go back to “FUNCTION SELECTION” screen. In this screen, select “4] TROUBLE CODE CLEAR" and preSs “EnTER)".

SCAN - 100 FUNCTION SELECTION   
REXToN ECU DSL D27DT   
1] TROUBLE CODE   
2 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10024

5. The “TROUBLE CODE CLEAR” screen is displayed. If you press "ENTE", only the history trouble codes will be cleared.

# Note

•Current trouble codes will not be cleared. •Check the trouble codes after clearing the trouble codes.

![](images/496a2899ca043328e580cdc71c87f3d85e058d74a80f905fbabb0749dd6db2f0.webp)

![](images/80f86c9de5550a94d5414f9cc2dd13580277c11716ec381d740b283ca1dc26a0.webp)

![](images/9b080c4848f843b790614b6d8eba04c67116eb2b97776e6d942ffa59318f5a58.webp)

# ECU Identification

Preceding Work: Perform the “Entering Diagnosis Procedures"

Q SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
21 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10028

. Select “1] ECU IDENTIFICATION" and press "EnTER" in “FUNCTION SELECTION” screen.

![](images/d1ba38c3c43aae8ccf08f6911a982d3b4b3bc551806ae526fbca15c2dfe30e67.webp)

2 The “ECU IDENTIFICATION” screen that shows the VIN, ECU software number, ECU software version and programming date is displayed.

![](images/f5ed590a8fc77bfe930a4b85bb845e13245d717555826d8aae832ff176c6904c.webp)

![](images/f9937e87cd7573997468c579ce267b639f7ee342e395cb3b1625131edf24eda9.webp)

If you replaced the ECU, press “Enter” to input the vehicle identification number.

# Injector Coding (C2I)

Preceding Work: Perform the “Entering Diagnosis Procedures"

# Notice

If the injector/ECU has been replaced or the injector system defective is suspected, go to C2l Coding item and check the injector and coded injector C2l value.

1. Select “6] INJECTOR (C2I) CORRECTIONS” and press ENTER)" in “FUNCTION SELECTION" screen.

![](images/b05de921261edd4f9e02a54cc61743cfabe4e9786519073cd03047fe1bdb6bdb.webp)

![](images/aa082d8c38cfa22fd299ac0266985804129e7d40df3067729de9319df2c69ae0.webp)

2 The “INJECTOR (C2I) CORRECTIONS” screen that shows current C2l coding values of #1 to #5 injector is displayed. 3 If you replaced the ECU, enter the C2I value of the relevant injector.

SCAN - 100 INJECTOR(C2I) CORRECTIONS   
REXTON ECU DSL D27DT Programming Data : 2003-11-21 Tool Signature : 00 50 59   
#1 Inj. : B8 B9 D4 1B 41 C6 0E OF   
#2 Inj. : 80 CA A4 A6 4E 2A 92 54   
#3 Inj. : 08 CE 7C A6 4A 4A 74 33   
#4 Inj. : 60 AD 33 93 31 39 27 28   
#5 Inj. : C8 C6 7C E4 D1 FE D2 74 CONDITION : ENGINE IS NOT RUNNING   
[ENTER] : Display Write C2I Menu Y220_10033

# Note

•The C2l value of replacing injector is recorded in the label.   
•C2I coding number: 16 digits (ex, B1 B9 D4 1B 43 C6 OE 4F)

![](images/9d149542786ec7943773d536471c16a968bac3736fab2a8c536b1fd9ea91424d.webp)

![](images/b42b5466a7a74b2be2d4c15703a40934d6d18ba6a4c7c087219d90efd6de732c.webp)

![](images/86764db76ed7d34d1cf06d0974514fc2152f216ce88b1bfad149db1f229bd38e.webp)

3-1. If you enter the invalid C2l value of the relevant injector, the message as shown in figure appears with alarm sound.

# Note

If you want to go back to previous screen, press Es " key. You can see the previous C2I value.

![](images/796543cdb9cff866a500190cf1ce1cc4aca9bd3749f3e4e08903adc959065812.webp)

3-2. If you enter the valid C2I value of the relevant injector, the message as shown in figure appears with alarm sound.

![](images/e38ee82df69e4f4c8767f4bfcdcb9adefe9d4ae7357f4f4f8714d37d4a1a381c.webp)

# Leak Detection

Preceding Work: Perform the “Entering Diagnosis Procedures"

# Note

This item is for checking the high fuel pressure after the IMV supply line of HP pump in DI engine fuel system. If you still suspect that the fuel pressure system is defective even after no trouble is detected, perform the fuel pressure test again by using a fuel pressure tool kit.

1. Select “7] LEAK DETECTION" and press “EnTER" in “FUNCTION SELECTION” screen.

![](images/e000458e6ad7a8c25877c8b607cac89aa35b9d9c8c14b7b03ae69ad3e6027a0d.webp)

The “LEAK DETECTION" screen that shows the checking conditions as shown in figure is displayed.

Q SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10038   
SCAN - 100 LEAK DETECTION   
REXTON ECU DSL D27DT   
> Test Condition <<<<<<<<   
- Idle Running(Vehicle Speed = 0)   
-Engine Temp. : 60-100°C   
- No Detect Battery Fault   
- No Detect Injector Drive Falut   
-No Detect IV Drive Falut   
- No Detect Rail Press Falut   
[ENTER] : Start Leak Detection Y220_10040

![](images/25cfb697caa5ffcf4b71f71f8aab545d1aaf592cf0ad5c7437a4aa06429e51ea.webp)

![](images/0fd3a5b5b3949fbdc66b743dbe8846be5192d45d4965ba5eb7cfeaaf640c86ad.webp)

# Variant Coding

Preceding Work: Perform the “Entering Diagnosis Procedures"

1. Select “8] VARIANT CODING” and preSs “EntER)" in “FUNCTION SELECTION” screen.

Q SCAN - 100 FUNCTION SELECTION   
RExtoN ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C21) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10042

![](images/4e36d8a05e37957a8c5ae4b92b91d265136e43f9d1b278cf6f47312415091d45.webp)

2. When the "VARIANT CODING” screen is displayed, select “1] READ VARIANT VALUE” and preSs “EntER)".

3. The "VARIANT CODING” screen that shows currently equipped devices is displayed.

SCAN - 100 READ VARIANT VALVE   
Addit ion Heater(PTC) Yes   
Cruise Control No   
Immobilizer No   
Gear Box Type A/T   
Vehicle Speed Sensor No   
Emission Cycle Europe   
ABS/ESP Yes   
TOD/Part Time TCCU Yes   
Remote Start Engine Yes   
Programming Date : 2003-11-21   
Tool Signature : 00 50 59 Y220_10044

![](images/1d3143a2e7f5dfdf3dc5e34f344570c015a9b2c9315eadfff7105bc577de11ca.webp)

4. If you need to change the variant coding, press “ ESC " key to go back to “VARIANT CODING” screen. In the screen, select “2] WRITE VARIANT CODING” and press

![](images/e62596131b00e9051f28d88f8865b0ba87756b1bb9e737571211e2a9205ff1df.webp)

5. When the "VARIANT CODING" screen is displayed, change the item by using arrow keys.

![](images/e9e71e29a0bf6d9e98ba6c1697b6c73138bf61bae124d99e7d7bc5a86cfd1dad.webp)

6. If you press “Enter", the message as shown in figure appears. And, then "“VARIANT CODING” screen is displayed.

7. Select “READ VARIANT VALUE” to see the coding coded value.

![](images/495f68e82be8dd5f9cb7350447e477307e268e02b0d79c6569565a2ff3adfacb.webp)

![](images/b0ebee93db3be437a7855498badf793cb7ea0f435329a0272c1f41c927e5bbcd.webp)

# ECU Replace

© SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10048

Preceding Work: Perform the “Entering Diagnosis Procedures"

1. Select “9] ECU REPLACE" and press “FUNCTION SELECTION” screen.

SCAN - 100 ECU REPLACE (STEP 2)   
REXTON ECU DSL D27DT Turn "OFF" ignition key and then replace the ECU. Be careful not to turn "OFF" the SCAN-100.   
(If turned OFF, start from first)   
After replace, ignition key "ON"   
and then press "ENTER" button. Y220_10049

2. When the “ECU REPLACE (STEP 2)” screen is displayed followed by “ECU REPLACE (STEP 1) screen, turn the ignition “OFF” and remove the currently installed ECU.

# Notice

Do not turn off the Scan-100 at this time. Record the below data:

Vehicle identification number   
Variant coding value C2I coding value   
- Multi calibration

![](images/1bcf4ec258c6b97e4130ce1da7303d6805bd86cffeee3a41b3a1ea1ef8b4b1c7.webp)

3. Install the new ECU.

![](images/562636ddc6a97131ab47889b536f0a4c097f802e0b8232a2604508ea35121471.webp)

If you turn the ignition switch to "ON" position and press "En, the message as shown in figure 1 (system initialization) appears, and then “MULTI CALIBRATION SELECTION” screen (fig. 2) is displayed.

![](images/fdc8203d67bcec15f03d5b2fa24edabea5ef136e79d207dabda3f33a9045cfc5.webp)

5 In “MULTI CALIBRATION SELECTION” screen, select “2] DOM/GEN” for automatic transmission equipped vehicle and select "4] DOM/GEN” for manual transmission equipped vehicle.

![](images/9b6f82450c7110540a394e36df17bcb8e6fb31ee493b21728283101299335839.webp)

6When you press "EnteR", the processing message as shown in figure appears.

![](images/bb109f30678aebc08c2a514451ca137ee64a0ff2a41db17c321822036e71f9f9.webp)

![](images/b017a0f36efa33631f2dc4ec406b3c5ed8337ed5b93e1645a626e0474b2f4cb5.webp)

![](images/5884455518a428afa0bad10c50bb081df925f8c61ffc1942e087958623fee92b.webp)

7. If the multi calibration is completed successfuly, “ECU REPLACE (STEP 5) screen is displayed. Backup data:

-  Multi calibration value - VIN value -Variant code value - Injector (C2l) value

![](images/842de39d96fdca64da0b59932589caf97e2ef4bbb62979aa96135204ffd1a125.webp)

In immobilizer equipped vehicle, the immobilizer coding should be done after completed the multi calibration.

![](images/44d0f6d871573434a2625d3d4b0d393858be4083ff7375c7fbaa15ed1714987e.webp)

Press"EnmeR" and enter the user password.

![](images/3b752b27ffb72e0c56fc4b4100bba3b64aec964822f56487c2434395bb8081b2.webp)

10. If the password is invalid, the “access denied” screen as shown in figure is displayed.

![](images/88f892350411ce21044ce2b67e1aaa8a43f18bc712d4a74c331025fb3425b09f.webp)

11f the password is valid, an immobilizer coding is started.

![](images/0ceed95dc4ec50c156e6840e7b4a79826f25a8917491e5a0cca265378665ef97.webp)

12. If you want to code for additional keys, remove the first key from key switch and insert the second key. Turn it to “ON” position and press ENTER" to proceed.

![](images/58705018b44d3af9adabd01f0db3cda5f0e619cb95b46fd887d8746a5e0e9ce1.webp)

13. You can code up to five keys with same manner.

14. When the immobilizer coding is completed, press “esc „ The completion message as shown in figure appears.

![](images/3048202629943a6fedc28e23cc6d5e69bf62305c841143c8afad9cfe53f8b6d9.webp)

![](images/ea29f7d9c46a50c1e4c4469ad40c10bf5b83572b9b37fb723bc0155658f5b6f2.webp)

![](images/ca595d710cb5efda1ad299c0536850af74baf0a88330bd3f6106542a15e013ed.webp)

15. When you turn the ignition key to "OFF” position, the message screen as shown in figure is displayed. Wait for 15 seconds and turn the ignition key to “ON” position.

16. Press “EnTER" to retUrn to “MAIN MENU" screen.

O SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10061

![](images/048630e3c854a3ad44ea5e07125dfdd5e4f623d3217f49a953f96b1b615434d1.webp)

# TROUBLE DIAGNOSIS TABLE

INDEX OF DTC . .. 10D-24, 71   
Trouble diagnosis table .10D-27   
Trouble diagnosis procedures. .10D-75

![](images/9b188a1101f950cc464d185efd0133e3d6b1a06f0d9c3ddc90f1af94dbd61f65.webp)

# INDEX OF DTC

P0102  Low HFM Sensor Signal (Circult Open) .... DI10-27 P0704.  Clutch switch maltunction . . DI10-38 P0103  High HFM Sensor Sgnal (Circut Shor) ... DI10-27 P1115  Coolant Temperature Sensor Malfunction.... DI10-39 P0100  Mir Mas FJlow (HFM) Malfunco ... DI10-28 P0118 Coolant Temperature Sensor   
P0344  Cam Position Sensor Malfunction .. ... I028 Malfunction - Shor .. .. 1039 P0341 Cam Position Sensor Malfunction P0117 Coolant Temperature Sensor   
(Poor Synchronization) . ... DI10-228 Malfunction - Open ... ... I1040 P0219 Too Small Clearance of Crank Angle Sensor .. DI10-28 P0115 Supply Voltage Fault to Coolant   
P0336 Too Large Clearance of Crank Angle Sensor . DI10-29 Temperature Sensor... DI10-40 P0372 Crank Angle Sensor Malfunction ... ... DI10-29 P0685Main Relay Malfunction DI10-40 P1107 Barometric Sensor Circuit Short/GND Short... DI10-29 P1405 EGR Solenoid Valve Short Malfunction - Short .. DI10-40 P1108 Barometric Sensor Circuit Short .. ... DI10-29 P1406 EGR Solenoid Valve Malfunction - Shor .... DI10-40 P1105 Barometric Sensor Circuit Short…. .. 1029 P1480 Condenser Fan #1 Circuit Malfunction - Open . DI10-41 P0562 Low Battery oltag.e . -0 P1481 Condenser Fan #1 Circuit Malfunction - Short . DI10-41 P0563 High    .. .. 1030 P1482 Condenser Fan #1 Circuit Malfunction -   
P0560 Bat   . ... 0-– Short to Ground . ... DI10-41 P0109 Low Booster Presure Sensor Signal... DI10-31 P1526  Condenser Fan #2 Circuit Malfunction - Open . DI10-41 P0106  High Booster Pressure Sensor Sgnal ... DI110-31 P1527 Condenser Fan #2 Circuit Malfunction - Short . DI10-41 P0107 Booster Pressure Sensor Open/GND Short . DI10-32 P1528 Condenser Fan #2 Circuit Malfunction -   
P0108 Booster Pressure Sensor Shor.. .. I1032 Short to Ground ... ... I1041 P0105 Supply Voltage Fault to Booster P0325 Accelerometer #1 (Knock Sensor)   
Pressure Sensor... . DI10-33 Malfunction .. . DI10-42 P1106  Booster Pressure Sensor  Malfunction ... DI10-33 P0330 Accelerometer #2 (Knock Sensor)   
P1109 Booster Pressure Sensor Initial Check Fault . DI10-34 Malfunction ... ... I1042 P0571 Brake Pedal Switch Fault .. .... 1034 P1611Injector Bank #1 Malfunction - Low Voltage ... DI10-42 P1572 Brake Lamp Signal Faul . .. 1035 P1612 Injector Bank #1 Malfunction - High Voltage .. DI10-43 P1571 Brake Lamp Signal Faul .. 1035 P1618  Injector Bank #2 Malfunction - Low Voltage . DI10-43 P1286 Low Resistance for Injector #1 wiring harness . DI10-35 P1619 Injector Bank #2 Malfunction - High Voltage .. Dl10-43 P1287 High Resistance for Injector #1 wiring harness .. DI10-36 P0263Injector #1 Balancing Faul . .. DI10-44 P1288 Low Resistance for Injector #2 wiring harness . DI10-36 P0266Injector #2 Balancing Fault .. DI10-44 P1289 High Resistance for Injector #2 wiring harness .. DI10-36 P0272 Injector #4 Balancing Faul . . DI10-44 P1292Low Resistance for Injector #4 wiring harness . DI10-37 P0275  Injector #5 Balancing Faul . .  104 P1293 High Resistance for Injector #4 wiring harness .. DI10-37 P0269 Inj #   . 10-4 P1294Low Resistance for Injector #5 wiring harness . DI10-37 P0201 Inj #p .. - P1295 High Resistance for Injector #5 wiring harness .. DI10-38 P0202    #2p .. 10- P1290 Low Resistance for Injector #3 wiring harness . DI10-38 P0204 Injector #4 Circuit Open . 1045 P1291 High Resistance for Injector #3 wiring harness .. DI10-38 P0205Injector #5 Circuit Open. DI10-45

![](images/3061581539b2f2b125b3ed3ff58346c0e3b0afc782a72c55165de39336b71cdd.webp)

![](images/ca51ca02da269cf8d04850a434b0ec08b73af84384d5cb56b9e769c0071d299c.webp)

![](images/99b23c82cb6bd1408ac9340d879f1a22432ce308c7b9efb4caec6543964c30fa.webp)

![](images/0af7f6e57adfd357fca38c06fe61f8b79bd1aa8d4bac73a2acaf70ff33acaa6e.webp)

![](images/d717d16c767c0a89255883738b43eb0c400cc0fe74533f9df44ea4cb8960bd6a.webp)

# TROUBLE DIAGNOSIS TABLE

![](images/61e4dc6208005ab9b58e3aa8428e69fc4894ce1bbc48753d9e8a2196d072a18c.webp)

![](images/64df2008b8616365558a7548dfd924a90cbd00a697988b2b2abb0307fffcbce1.webp)

![](images/9824289df17b7d284dcd5bfe68b818e56e6ba94ce1da63586fceb0d6245836b5.webp)

![](images/757a0f80ec2eca2a055b8645724200f5a431dae22ffd6290047c45468c1815e9.webp)

![](images/a2c75f2ae005158ce963e6e87f38c45ea046acfcd47278de5d5692a2f19fd549.webp)

![](images/d094b8562c680a636b22aae8b71dc9d71802fb44e6c6d78bc6dca371aa7a61ab.webp)

![](images/dd5fddf7bed32ee48bb3c8c75c63565156e3dd5aaa298cea25bbb7db7ce25301.webp)

![](images/b67c19e758b6ef16a21f76207016f997a41739e044e5137ba14abefcc0cb8859.webp)

![](images/0a82ad07280cfdf6f376eb2ade3b40421d6347fb8992f19cd3dd7b429c82d004.webp)

![](images/3b8ed097e87301a98c92c0631becbc2548516e9239293cbd33ed2168c88c866a.webp)

![](images/767d42928254cbef0511a7212a20f6f1857ae4eef16c66fa1cdb67495ab47cb0.webp)

![](images/a8b0f9d25a83fbea3abafde7f63709360588ebd2ee40c5ddaa240bb36c39fe93.webp)

![](images/50aaa5b0a930c39b1a57d78c4e29e6d772d1ace7fa333c369562ddb629587232.webp)

![](images/8ebf2c8354c05b519080282b8a2d41bbfb301e8081197f96ab6db2c96f738ee0.webp)

![](images/bc215f351b2436d5987fc98e621574e82e555590e035e0620bd30899ee4ee56b.webp)

![](images/c6ba9508a0f6be0d54a937f04aeed7f7cf1c5d20a35ce74ad5d17ecf2f6cfff5.webp)

![](images/896f311ff127af3e816ad684b331d23aec27100a269ef05276338eb0ee1706f3.webp)

![](images/7bae30d8bbacbaa2ef59ec40aa4f9b8d80853e639a73136d4c3fcfa1f78d4363.webp)

![](images/50602c8d483f3dc3a07244fce971c4dd6981e069f309a4b17460ec10f0ac60dc.webp)

![](images/963b370c17e2e3cd199106896effa8a0de0a2508faf7fba2141611991a2c372f.webp)

![](images/db8ef0454a0a75320aa8b7af4ca457a7ed04917b5d7b059b881444ea38fbbe5c.webp)

![](images/e00d88abe0f5ac778df70d38a59e2dbb445de27039549cb8c2b7e8a709dfc12c.webp)

![](images/1027ee91b1b04fea8db433f90e9e87449b7d2fb55161168c10552d3639a8a45e.webp)

![](images/675262b7ca7dea6880bc9a386cbaf3a15319b50d5cf180d53a8155c4c5a4afba.webp)

![](images/96c5259b2cd6f02dc4cf86f4977190112d9818063df47def9186b159e8cf7ef4.webp)

![](images/15c83f9b2bc951e72b34ff55f98d3ccc6645dbc9828bcc5cc4b8d9860bb882e1.webp)

![](images/285c179a4fa09c479f1844981b1e006caad1184ed3cb8c873e881f8050c6e43f.webp)

![](images/0d26cd7405fd572d9dd0ecb663d994bee62dee14a6d6daffcb3028ea5c2f098f.webp)

![](images/65449b4d3399aab9350468a0fe89c57362de4d6b0e954eb6fec1874181d33606.webp)

![](images/9e1d321bb2b94e2afcfc5804d360f5bbe4d8161b76c942bae7397cda9279b06f.webp)

![](images/acca7a7c633c5d01d67aecad53b83898a6c46ac1908866fc420300e524c65312.webp)

![](images/48a3196d81a620a930675c51a5db9d7d70ce1da60e7d41a0bc329d42f0a38bff.webp)

![](images/cd14a9fab8019f6d0c8fdc6918acfcd60627d05dc982d0ccec7147d9c5a06387.webp)

![](images/2bf59344f267ca0c178da0162a7af3e70d1fae583cdb30ac73f6754431a3955b.webp)

![](images/3493416575dfae855a8900a66f6671fc29b13f6d479f97eafbca20c082dada73.webp)

![](images/83a400f9802fcc612b8d70aad9d20d6e3ed5cb90961348a0e365f9f9ff348b3a.webp)

![](images/d1f4b2d12724cbc8fe87bd93f31a8db867f6dde9386e9a7793e53eeff7515e66.webp)

![](images/f1bc0ac45edf7fcb5d8689108fd85837852d8978445a3a654a978e9d9ced57e1.webp)

![](images/3b8e71aaed1d6b8d042aac71d322f80625d354b695da907b2881900c268cc759.webp)

![](images/fd1e081d2e22d028b815e54ad375a1aaea97cb79357ed9cadea9e95b51c360b4.webp)

![](images/88fb2fa7cbcaf75314423928b3b23561305d17eb31b5ad471ff8289ed5df568d.webp)

![](images/40e71afd7de048b50ae9701541c3880ca7f7641cf7b1dbd448fd7dc4a1dadfdc.webp)

![](images/9b4c156c3db57f3ff15a2ee8cc7c0a77dfc0eab259b6bc02b90fe4a37aab0604.webp)

![](images/2408c45dfe009bcc1320e874d7f8f6da3ef592577c7a2d5c5c0660d9e2249b59.webp)

![](images/6a74737608506e3306bc2cd4c38a98bdfd861fb18650e91f523d73300df960b0.webp)

![](images/03613e52861a92a80e0c08899b85a9e7579dd8f1e7bf9b66c33f8661cc73715f.webp)

![](images/9065dffe12fa33f81ddc5b12d96719df249e4084d3a148bf349380a8b80ac8ce.webp)

![](images/7e14f6444062f54429ec71f7cfcf1f3f6967c13734498d0a8506d2535b1f4366.webp)

![](images/88f222434820493ee7d84ae9d45d13d9a9ffe375078736dadac5e1cb78e11db3.webp)

![](images/87d63c9c0273f2acb61cfa9dbd5fcb66677ebab7054c025ddc147c1422a920c0.webp)

![](images/e1290c17532aea80e9dbee40574022164f85cb911537bea915049f26404c4765.webp)

![](images/8684aaeaff4bbc0ad37f37f81d55743a94bf1e5880b86c5e0e03eea2d77240c8.webp)

![](images/d0dba42bc4319ad0f0a65acfa2feae8faffb93bddaea5471ecd3842b327a8441.webp)

![](images/5f88f7ee5521483d8b78e6b46d5a422c5b87b974ffca9f2843bf86653a92c11f.webp)

![](images/6fb9c4cc99d481f15e4179138450b2ddeddfdf4c0d322e1057f315b4b664d1e8.webp)

![](images/1236414609855cec2823593795524b76dba83407ba4a9f8177697a99df3a3e28.webp)

![](images/a3ecabeeb754b05842653a0ba96bca8a8f854520e8e3214dd29305d93f96532e.webp)

![](images/3b9b0e1ed380e786871f718e4047e24408412ddd9ab1500d02bb98747f534e12.webp)

![](images/bd9d6af364fe72cb4f2761e00950930215a7d72b34060286a22120021ecc5963.webp)

![](images/9c0e3c073c4ca5fe88d4f35d83f89c5aad8197d3e5cc31cdc5b5f09627a2874c.webp)

![](images/350362038ee88cc9823b7fc5ca7b4c6bc7786ff2fa256fd817532417944e1928.webp)

![](images/237ec579d4bdcdfd7c8f47b9570f7e4e16b81a0ff4586cd01d9ab1e01bda2324.webp)

![](images/ca5452d078706bd21d2244dc78ba3bc86e88bff3528eaf256c6cc85aa329f817.webp)

![](images/0bedd977a06afff4030d259c82bf87ae29df7774f9879dbb2b785c87fde07b7f.webp)

![](images/7c51f4c99e23fffe4be118d507f17f6f265f13bfb7b1c5f056108e7de3104b27.webp)

![](images/b374ed1de28bbc72671984ed87879ce83b5a08f77645b9113304919245e783f5.webp)

![](images/38c4ae30aa78a110cf16ee8f9519929cfc68e8985ce9acba4fe1992e5dbb8e02.webp)

![](images/286ea8a659d8d631d110d5f9d4d8880196d18b950247738c8accec95279a5885.webp)

![](images/70a0fce854f6900db9a00cba43bc98f129ff7652c1a99d0138e12b60716d6d29.webp)

![](images/cb5306b500692b5329a98dab05f0da6bbb605de1d26d85ca263bb465913396d6.webp)

![](images/774eb48b012675f23de7e59f77afc2b470b28f38244f978c1b6cb7b2a4b8fc47.webp)

![](images/a4e18e6e73866d7704b900ee0d28012a7aae8aac980c31d486be5fb9a18fc87f.webp)

![](images/edc6e50c9399739041267ff880eec804a5b77d7cb21ea3bf837c79e6350e6b93.webp)

![](images/5d5a99b1961d2ba2ac8a5dce30770e48dcc1cf6bc7ef0e143f92d008ca0f79e5.webp)

![](images/62cd6badc14eb115a5ba9c886804df10a843265a5780576ea4b2d2c62d6ae8e7.webp)

![](images/aec449b815e4575f7aa00660cd6e39ee1e81fc53bc6ea573a1289d1d24aba947.webp)

![](images/feb6370fa62ebde12986fceae1d002351fd108d4c31941e7605aa52375c88a49.webp)

![](images/b4fab38c0293ecaeb9de3ea0d06b331b5f9dc92f1542bef9f36d2f09fbe2b7b0.webp)

![](images/45c6cbd514cb8f24f5b3db3a1f1e820b0e61898f0718b5e92dab40ec71b3932e.webp)

![](images/62366b707826ca89365e345025daa8971b54cceb6b1bad9f24a69a547ca46aa6.webp)

![](images/ba86aa66e128968fb3b1892d2bbd43b09829ad12a34ed12e016b3f049d6d95c3.webp)

![](images/216796f2be001deefa0626251220b97faa49ca4a240b7ef8f69656f667ea7376.webp)

![](images/544bdf4640b0e4da092d75d70fa923f803340778c3d081c4cbc5762606a63ae5.webp)

![](images/dad8890892c53f01bcf905b5cb44e8620f3598e8d4b964fa80e383d8f3e4eff7.webp)

![](images/ec92344215276269b150467bc9283fc40d69362489a8de873b905626787918a5.webp)

![](images/118e6e0b41ae1504584186a1aaa9d61a6db9aee8879702bc2dbb2ca2d4f74fde.webp)

![](images/e0bf284b146a98ad8851fff44f62e95118bac43c3d25cafd992d5dc2dc9ac561.webp)

# INDEX OF DTC

HMF sensor Signal Fault (Electric Failure) .. DI10-75 Brake Lamp Signal Fault. . DI10-91   
P0102. . DI10-75 P1572. ... DI10-91   
P0103. . DI10-75 P1571. . DI10-91   
P0100. . DI10-75 High Wiring Resistance (Injector #1) . DI10-92   
Cam Position Sensor (missing event) . . DI10-76 P1286. . DI10-92   
P0344 .. . DI10-76 P1287 .. I1092   
Cam Position Sensor Malfunction High Wiring Resistance (Injector #2) . DI10-93   
(Poor Synchronization of Crank and Cam) . DI10-77 P1288 . DI10-93   
P0341. . DI10-77 P1289 . DI10-93   
Too Small Clearance of Crank Angle Sensor. . DI10-78 High Wiring Resistance (Injector #3) . DI10-94   
P0219.. . DI10-78 P1292.... . DI10-94   
Too Large Clearance of Crank Angle Senso.... DI10-79 P1293.. . 1094   
P0336 . . DI10-79 High Wiring Resistance (Injector #4) .… . DI10-95   
Crank Angle Sensor Malfunction. . DI10-80 P1294... .. 1095   
P0372. . DI10-80 P1295. . DI10-95   
Barometric Sensor Malfunction (Out of range, using High Wiring Resistance (Injector #5) . DI10-96   
stra n y AP r.. D1001 P129. … . 10.6   
P1108 .. . DI10-81 Clutch Switch Malfunction . . DI10-97   
P1105 .. . DI10-81 P0704... .. I1097   
Battery Voltage Monitoring Signal Malfunction .. DI10-82 Coolant Temperature Sensor Malfunction   
P0562. . DI10-82 (Implausible Signal) . . DI10-98   
P0563. . DI10-82 P1115. .DI10-98   
P0560 ... . DI10-82 Coolant Temperature Sensor Malfunction   
Booster Pressure Sensor Malfunction (Electric Fault) DI10-99   
(Out of range with Key ON) ... . DI10-84 P0117. …… ... DI10-9   
P0109. . DI10-84 P0118 . DI10-99   
P0106. . DI10-84 P0115 . DI10-99   
Booster Pressure Sensor Malfunction Too Fast or Low Main Relay Operation . DI10-100   
(Out of range with Key ON) . . DI10-86 P0685 . DI10-100   
P0107... .. DI10-86 EGR Actuator Malfunction . DI10-101   
P0108 ... . DI10-86 P1405. . DI10-101   
P0105... . DI10-86 P1406.. . DI10-101   
P1106 .. . DI10-86   
Condenser Fan Driving Signal Fault (Type 1 . DI10-102   
Empar lvw Aauaction .. 100.-8 P14 10   
Brake Pedal Switch Malfunction . . DI10-90   
P0571 . DI10-90

![](images/9bb659232ea392248338e140b8fa896b6b2b0c49d094fdf554059a6aa2690a11.webp)

Condenser Fan Driving Signal Fault (Type 2 ... DI10-103 Open Circui (Injector #3) . … ... DI10-119 P1526 .. ... DI10-1103 P0203.. . 0-19 P1527. . DI10-103 HSD Circuit Short to LSE (Injector #1) . DI10-120 P1528 .. . DI10-103 P1201 . DI10-120   
#1 Accelerometer Malfunction HSD Circuit Short to LSE (Injector #2) . DI10-121   
(Idling Signal/Too Small Noise Ratio). . DI10-104 P1202. . DI10-121 P0325. . DI10-104 HSD Circuit Short to LSE (Injector #4) . DI10-122   
#2 Accelerometer Malfunction P1204.. ... DI10-122   
(Idling Signal/Too Small Noise Ratio) . . DI10-105 P0330.. .DI10-105 HSD Circuit Short to LSE (Injector #5) . DI10-123 P1205... . DI10-123   
Injector Bank 1 Malfunction   
(Short to Ground or B+). . DI10-106 HSD Circuit Short to LSE (Injector #3) .… . DI10-124 P1611 . DI10-106 P1203. . DI10-124 P1612... … . DI10-106 Fuel Temperature Sensor Malfunction.… . DI10-125   
Injector Bank 2 Malfunction P0182.. … ... I0125   
(Short to Ground or B+).. . DI10-108 P0183.. . DI10-125 P1618. . DI10-108 P0180.. . DI10-125 P1619. . DI10-108 Glow Plug Malfunction (Driving Signal) .. DI10-126   
Cylinder Balancing Fault (Injector #1) = P1678. . DI10-126   
Clogged Air Intake System. DI10-110 P1679 . . DI10-126 P0263 ... DI10-110 Heater 1 Malfunction (Driving Signal) .. . DI10-127   
Cylinder Balancing Fault (Injector #2) = P1530... .. DI10-127   
Clogged Air Intake System. .DI10-111 P1531... . DI10-127 P0266. .DI10-111 P1532. . DI10-127   
Cylinder Balancing Fault (Injector #4) = Heater 2 Malfunction (Driving Signal) . DI10-128   
Cloged Air Intake System ... DI10-112 P1534... . DI10-128 P0272 .. DI10-112 P1535.. . DI10-128 P1536 .. . DI10-128   
Cylinder Balancing Fault (Injector #5) =   
Clogged Air Intake System . DI10-113 Rail Pressure Control Fault P0275 . DI10-113 (Too High Pressure) . . DI10-129 P1254... . DI10-129   
Cylinder Balancing Fault (Injector #3) = P1253 ... . DI10-129   
Clogged Air Intake System …. , DI10-114 P0269 ... . DI10-114 Rail Pressure Control Fault (Too High IMV Current Trim, drift). . DI10-131   
OpenCirui inpeco 1). DI101 15 P125 . 10131   
Open Circuit (Injector #2). DI10-116 P1258... . DI10-131 P0202 DI10-116 P1259 .. . DI10-131   
Open Circuit (Injector #4). DI10-117 Rail Pressure Control Fault P0204.. DI10-117 (Too Slow Pressure Build Up while Cranking) ... DI10-133   
Open Circuit (Injector #5). DI10-118 P1191. . DI10-133 P0205. DI10-118

![](images/43cc21b2b167bbe9a0af29bce435bdbaada90f8356907369dea6190f2bfb7c92.webp)

IMV Operation Fault (Electrical Fault) . . DI10-135 Accelerator Pedal Sensor Malfunction   
P0255. DI10-135 (Electrical Fault, Track 2) . DI10-147   
P0251. DI10-135 P0222 . DI10-147   
P0253. DI10-135 P0223 . DI10-147   
Intake Air Temperature Sensor Fault P0220 .. . DI10-147   
(Electri ... I00136 Fuel Rail Pressure Sensor Malfunction   
0112 . DI10-136 (Out of Range, ADC or Vref . DI10-148   
P0113. . DI10-136 P0192. . DI10-148   
P0110... . DI10-136 P0193. . DI10-148   
MDP Faut ilecr 1). .. I11017 P019 .. 10145   
MDP   # . . DI10-137 Fuel Rail Pressure Sensor Malfunction   
P1172. . . DI10-137 (Out of Range when Key ON) .. P1192. . DI10-150 . DI10-150   
MDP   #4 ... I10-138 1193 . DI10-150   
P1174 . P1190 ... . DI10-150   
MDP Fault (Injector #5) . . DI10-138 Main Relay Malfunction - Stuck .. . DI10-152   
P1175 . 021-   
MDP Fault (Injector #3 .. .. DI10-139 Vehcp. . DI10-153   
P1173 . . DI10-139 P1500. … . DI10-153   
Rail Pressure Fault (Too High) . . DI10-140 5V Supply Voltage 1 Fal…. … . DI10-154   
P1252 .. ... 10140 P0642.... .. DI10-154   
Accelerator Pedal Sensor Malfunction P0643. . DI10-154   
(Relationship between Track 1 and Track 2 ... DI10-142 P0641..   
P1120.. ... DI10-142 5    .. -   
P1121. . DI10-142 P0652...   
Accelerator Pedal Sensor Malfunction P0653. . DI10-155   
(Limp Home Mode Operation) . DI10-143 P0651. . DI10-155   
P1122 ... DI10-143 2.5 p . ... 0156   
Accelerator Pedal Sensor Malfunction P0698... .. DI10-156   
(Torque Reduction Mode Operation) ... . DI10-144 P0699. . DI10-156   
P1123 . .. 1014 P0697 . … .. 10156   
Accelerator Pedal Sensor Malfunction Turbo Charger Actuator Operation Fault (signalDI10-157   
(Electrical Fault, Pedal Stuck) DI10-145 P0245... . DI10-157   
P1124.. ... 0145 P0246. .. .10157   
Accelerator Pedal Sensor Malfunction ECU Watchdog Fault . . DI10-158   
(Electrical Fault, Track1) . DI10-146 P0606 . . DI10-158   
P0122. .D110-146 ECU Watchdog Fault (Injector Cut-of ... 10159   
P0123 DI10-146 P1607. . DI10-159   
P0120. . DI10-146   
ECU Watchdog Fault (Watchdog Trip) . DI10-160   
P1600. . DI10-160   
P1601. . DI10-160   
P1602. . DI10-160   
ECU Non-Volatile Memory Fault . DI10-161 Glow Plug Module Circuit Malfunction - Open ... DI10-171   
P1614. .DI10-161 P0674. . DI10-171   
P1615 . DI10-161 P0675 . DI10-171   
P1616. .DI10-161 P0671 . DI10-171   
P1606 .DI10-161 P0672 . DI10-171   
P1620 .DI10-161 P0673. . DI10-171   
P1621 .DI10-161   
Glow Plug Module Circuit Malfunction - Short ... DI10-172   
P1622. . DI10-161 P1674.. . DI10-172   
ECU Memory Integration Fault DI10-162 P1675 . . DI10-172   
P1603 .DI10-162 . DI10-172   
P1604 .DI10-162 P1672. . DI10-172   
P1605. . DI10-162 P1673. . DI10-172   
Accelerometer Learning Fault . DI10-163 TCU Signal Fault . . DI10-173   
P1148 . DI10-163 P0700 . DI10-173   
EGR Valve Control Fault . . DI10-164 Air Conditioner Operating Circuit Fault . . DI10-174   
P0400 . DI10-164 P1540 . DI10-174   
VGT Operation Fault . .DI10-165 P1541. DI10-174   
P1235. .DI10-165 P1542 .... DI10-174   
TBD . .DI10-167 Excessive Water in Fuel Filter. .DI10-175   
P1608 ... . DI10-167 P1149 . DI10-175   
No Crank Signal . DI10-168 Immobilizer Malfunction . DI10-176   
P0335. . DI10-168 P1634 ... . DI10-176   
P4335 .. . DI10-176   
High Torque Trim. .DI10-169 P1630 DI10-176   
P1170. .DI10-169 P1631. . DI10-176   
Glow Plug Module Communication Fault . . DI10-170 P1632 ... . DI10-176   
P1676. . DI10-170 P1633 . . DI10-176   
P1677. . DI10-170 P0633. . DI10-176   
P1636 . DI10-176

![](images/179f79fdfea0a6be1cf6340f9a73d983c9cfbeb0a41c18186a60bc773296d1ca.webp)

![](images/3122c1f8dd017d4e98fe5f45aab5bc09b9c3ff95e253770be713fbd8b1cd7121.webp)

# TROUBLE DIAGNOSIS PROCEDURES

HMF sensor Signal Fault (Electric Failure)

# Trouble Code and Symptom

![](images/1eb48ccb21530ad63f20dc53dc78ddf5b951ca92f9b7c82cff1cc55f76941f4a.webp)

# Diagnosis Procedures

![](images/2ba7816a4d6863cf5d1e8dc09435067c090590a1fe31707cd0c976448878bae9.webp)

![](images/1f2b2a10a86074da2eb8491fd1f50f9caedef0aa37f5a4ff6a8bc5e7c9e4408f.webp)

# Cam Position Sensor (missing event)

![](images/cd957520efc6cfb182c27ac52ac7e0ceaa0bf87707c58126f54a1e099e83b651.webp)

# Diagnosis Procedures

![](images/bc8b3f640a54833bb05fb1306b85bc4d8b658808b958a0f8f7fd441fbb4a0cf9.webp)

![](images/e039c5cf27d89ced7046cd9580cfafaa2df876658c5d842571e36f5f523f681e.webp)

# Trouble Code and Symptom

![](images/4bbbb5b76d5afbb12210f62ca1667272c39e809d2ce5cbad178ed2b6d9cd9990.webp)

# Diagnosis Procedures

![](images/8a0074a4fd8034f6eb45cc4ee71c2f0b6f5749be7bbb0eaa39848d608099423f.webp)

![](images/624de970b2fe57c14a50d391697332e6920ed7ffd553f2f39ac633675a5879fc.webp)

Too Small Clearance of Crank Angle Sensor

# Trouble Code and Symptom

![](images/511e89c2b563c7e608b5dffc4de728e88b896350a9f719571b6ca944292fb576.webp)

# Diagnosis Procedures

![](images/10ede84486dd54b1b2309dd3cee7d576a208645c37c32d03fd527226d9694d7d.webp)

![](images/2417ea1da7b90a26e4b678b35658349c40fc5e50d6566c5a6850ae06957e4874.webp)

# Too Large Clearance of Crank Angle Sensor

![](images/0b44c55ee5c9438588255401912d7d9d63105da662edfad6627e3cb81bb7942a.webp)

# Diagnosis Procedures

![](images/e5328018154400cb445587e57971e34f3cbf0bf07ea4de52d538aad6c3669413.webp)

![](images/4c8265cfc940f6b3136229c614e98365a0942376dced578e0bf9fe1adff63811.webp)

# Crank Angle Sensor Malfunction

![](images/23fc7b329cf2ec791b980d9072dae4f0b37cfb2849434e328b10ed58a4999156.webp)

# Diagnosis Procedures

![](images/7a96128caaea6ae4ab2b7363ac4ababf2eb140b48b266490b0f83917dcaaa0b5.webp)

![](images/f33323ec079ae0ae3534f651781f8738c84a79318342872c6180f537a9ad15cc.webp)

Barometric Sensor Malfunction (Out of range, using strategy of restoring by MAP sensor)

# Trouble Code and Symptom

![](images/2dd1730ae5bec014713cad7844a2c25b7923f6a1dae81d0671d04ce9a54b4d25.webp)

# Diagnosis Procedures

![](images/edf1905f803d0af66e77d118f8172b6d5582bd5727dd9b2062557bc30015bd6f.webp)

Battery Voltage Monitoring Signal Malfunction

# Trouble Code and Symptom

![](images/2110eaeef3c07b86c0790b8c0fcb9404842f24d60ece0701117c056955d0a758.webp)

![](images/b587879e2c0169efc43778ecc32fa2aeab2c6f3d1e7112dcb7c7fb17a2faab5b.webp)

# Diagnosis Procedures

![](images/559368d2dca80dddd6e7e778c749f652b8f97a0f1b59f70742d8e37061bc310f.webp)

![](images/8ee2917604affb232f88d34863d5c89dc092339083b90b0e532281244864b01c.webp)

# Booster Pressure Sensor Malfunction (Out of range with Key ON)

![](images/18e7a092731cff37762a79574357e3af664f35e4ce62e6dda6dfbcc10edaf67b.webp)

# Diagnosis Procedures

. Diagnosis Procedures (Boost Pressure)

![](images/8763cf9157318a9ed8123ae39a4ab68c7c2760b2a2272200a6f6170088184d36.webp)

![](images/80900c7245f892bd42b11a6bab6135f93f71e2bbeb57e9e88964edca119bbe8a.webp)

Diagnosis Procedure (Check sensor (1))

![](images/e24cc292dbf689b41937294adbc66f0d9f2ff2ea0cac54aca04022e75fa825f6.webp)

![](images/cd7ae713d7bb9fb9ed6085df834770352674304e753ccc53de3d09233ce2a6cf.webp)

# Booster Pressure Sensor Malfunction (Out of range with Key ON)

![](images/8a4e43275026eaadc1e21eca4aa237c0befaabbe01b6a582e1c6c9e04f99bab5.webp)

# Diagnosis Procedures

Diagnosis Procedures (Boost Pressure)

![](images/dbfdafc8be9ae912d35699dee42ecbd3c6e98397278a232121899354d56abd3d.webp)

![](images/8644ceacbcc212df5702b70c570a655ffe3ed9d4b5dffb2729fa71f6b9cfaa8c.webp)

Diagnosis Procedures (check sensor (1))

![](images/708cf3edce9d16d9c917e735791dcb7716a753a0bc2fb32a5b2bcf27715dc563.webp)

![](images/575a9ab4e81b4f08a9529e4a01f2768387c0ea7d99b8463d47b523171c250f5f.webp)

![](images/7e80c208c34f986ac3717b5f1cb4732c9826762cd64705828a3ce624846ee41c.webp)

# Trouble Code and Symptom

![](images/b36c030a5ddb2bc7edf011099ddeaa1373f9a3ece3c564abc460727071cae3c2.webp)

# Diagnosis Procedures

. Diagnosis Procedures (Boost Pressure)

![](images/40537c3307251aa3c3089b372884adec66862ba537ec720a56f85382f3579a70.webp)

![](images/9bcb61b5b8f2b3566f84fbf78d5e0d44fc711ac770aed0563b84b96e3bc361d3.webp)

Diagnosis Procedures (check sensor (1))

![](images/b9081f26cd4ef35e64d8942acd68c0ba04f373ef5e47a1d69cd966447c0a6a62.webp)

![](images/4b8653ea4d4cd23db6dfd58dc0624eab7b979a69a8006f4b40cf2b13ea9f58be.webp)

# Brake Pedal Switch Malfunction

![](images/9f184e7ea1da0f29757cb71794efc72b1dc79f78c996bbaf08477f9e3c569fc1.webp)

# • Diagnosis Procedures

![](images/6d30f4cb0da72d40665968b8e228d7fdce45686d4b25a9a9c5cd1100ca2e94de.webp)

![](images/07438990a8490541e1e673df6ad7d0be718d8468e1339559f3af3982a0977cd8.webp)

# Trouble Code and Symptom

![](images/b06bfd63280e50224860d7b93bc54451135b25d3459d0912f97352eecaaa368f.webp)

# Diagnosis Procedures

![](images/2e1311d4c2f06a050eeb47dada56cf0642d3c5e1e3473978859a17427e5bae2b.webp)

![](images/0baafb451621be005fd4b4fd2f92601828f3cb54f490514cd2c5ecad85fb6b8c.webp)

# High Wiring Resistance (Injector #1)

![](images/01a3b6a6303b98a834f011fa68da2f8147883a2cd43a3b6b2ebe7eb235224426.webp)

# Diagnosis Procedures

![](images/48a75a5b3b2c72c6e12ffba6ffea58095ead86838244a28da4090f14de5a8b8d.webp)

![](images/43e0e9b664b0a9be46a531ee7c26af3f0960b46990dc4a001291f4bed225647b.webp)

# High Wiring Resistance (Injector #2)

![](images/f33b1be03f55344ee11d6099f72f58603b8b7dffdd93d2ac411017ae558bb7bc.webp)

# Diagnosis Procedures

![](images/afd65246aa93a999f035de047f184ec5706795dea80160e3f0161455b316bc6f.webp)

![](images/65f252e70cab9f0ab440a6acc3e571163588eada33db20f3ed7c11fc2f6c5236.webp)

# High Wiring Resistance (Injector #3)

![](images/9a8036343f2674c8c7ecfaa5290ad0fb477addd6287a06c41c8d34f23f66c22b.webp)

# Diagnosis Procedures

![](images/7f48d28e551ee1eea5325fc233ed24f3a79389cfe642ed04e492c6cfb5711095.webp)

![](images/9e6b48f02ddbd1c610bbfd82794790b62ea0e5e07bd003a76c6820ef61fba6b7.webp)

# High Wiring Resistance (Injector #4)

![](images/7d2e839538d2513a0a29e5045396b27a87a7d9a52afd04cf3141ff82d436bd4f.webp)

# Diagnosis Procedures

![](images/d1390e85acf4fc6e7c9197409e2d4b11d28c6c289c3dbefde5ce39c4fa4dfac9.webp)

![](images/d859ececc9ff057d4234a4fc3d79891db6630124a54102a1ef4cacfcb6b5b321.webp)

# High Wiring Resistance (Injector #5)

![](images/5075a445dba7a01024993989ce1628c077fea2a3217036cbc6ed0aa1d7c54536.webp)

# Diagnosis Procedures

![](images/dba31bab4692e108547b1ee98df31c86e5482f27f62762611e04ac7a3844e835.webp)

![](images/ef89ab9fa2c0ae9b3fc1deba5ca2abd9963ddf81972ff86845e2cd973f0cbd48.webp)

# Trouble Code and Symptom

![](images/41e56068d0f3cbcf10e6180abb2529f33555a937e21ec8db91648e5e77046bec.webp)

# Diagnosis Procedures

![](images/c02276802b46e025569b35143d3deabc7cb74a3f82b869e167a1330982294c20.webp)

![](images/232a1af721093a74d3ad7704ca7daa983649dfd4d082c2fd0a28fd0edc7acf3a.webp)

Coolant Temperature Sensor Malfunction (Implausible Signal)

# Trouble Code and Symptom

![](images/7654a80dd93d59fec91b979c1c427332d1e5c5322d22a4929e0f3d98d3873038.webp)

# Diagnosis Procedures

![](images/8f126690e623fca5dcf269a010ae66a8e3201c572fe8cf70e86074bfc6c92104.webp)

![](images/d1f7fcb823a1c5895915b54c26e1510d147f2d7c35ec1f5792df2f35acfc3f2a.webp)

# Coolant Temperature Sensor Malfunction (Electric Fault)

![](images/0443d5c7e6dc85b4218e4cdbe301f03841b47a19924024acc20f7f195859026a.webp)

# Diagnosis Procedures

![](images/0b641d57ff9abe0bee56633cdf174ac40c7738aa72181c08fba8bf6b4d01d5ee.webp)

![](images/dbdbd620b87c1dc7744722af9a548e519237d38ab4c70d4fd581de4c52a7696b.webp)

# Too Fast or Low Main Relay Operation

![](images/9ed168729c357c00b7ea342e730e5088c16fc8dd95a4d19c27fdb3efa158433e.webp)

# Diagnosis Procedures

![](images/c0e0e0c9f1d48d0132e015065d8ea90f6c6410c431d475a4afa50589f9a57da6.webp)

![](images/908e6175f61b160db6f5f3ecad99a8b0015455ac1e53c1c8845fe83f486c4bcd.webp)

# EGR Actuator Malfunction

![](images/831eb676e1a9e5157231dfc0c0a5c2c720f03517d52b2022d75967af2ac46fce.webp)

# Diagnosis Procedures

![](images/699ef4b08716d581c45a555f898fb6ddec284e4678e2bb2c9a3448b136787757.webp)

![](images/75fb7fa34d4af45f490cbed5efb352e9e262e1d5bc92e7cec4322c1b5f5a3a90.webp)

# Condenser Fan Driving Signal Fault (Type 1)

![](images/36782b6606b8b8a43c8aed31292a49146fc622d9b3f20e8f12013123e571033b.webp)

# Diagnosis Procedures

![](images/89731f550464616e1f54f21140e68d5a9b03b79dc42d799411ca0cb9148ba121.webp)

![](images/a5e7a060b6e1966324671c86258ab7855f3d163926012a7f9e3fa9eb7e4c1225.webp)

# Condenser Fan Driving Signal Fault (Type 2)

![](images/28125cc2f0f22ff1d54b136425ccbb9e1758dbc36459cffde834fa4e88b3a3b6.webp)

# Diagnosis Procedures

![](images/9084a07a57c245d9b328509c5620e64547fa76b3419087fee4fc6f0ac28299b9.webp)

![](images/d199575c46307d1d9f3181b10bae1efecb8d9ca3a241bb7137ddee2b4767cf69.webp)

![](images/86a2d65ab0730cb210a5abe5ce85f663e785f657e813afdb200f7ab45f925937.webp)

# Trouble Code and Symptom

![](images/818abb8c2aa25fdc76c63f65d9795e4b9c8974574b8ae8899a077ce9f11782a1.webp)

# Diagnosis Procedures

![](images/1dd74d5cb86e6eeaa5ef8732e0f66c6341c374a906095781493664a8f25b0b47.webp)

![](images/52e18845f846e1d2e566a982d028dbed572302deeab9d9a932b8267e0f20d2cf.webp)

![](images/177675c33002d68f647415e9f8d1ff5fd300968519cb05088cf741fb735c4a3c.webp)

# Trouble Code and Symptom

![](images/d3cb229110a074bd2979cc4404f264419add6146aafbe84e133096d95ef48763.webp)

# Diagnosis Procedures

![](images/fa46002ed95ef1927a91d38260d30416fa9c3c9203997d29e39d73535ca3d378.webp)

![](images/15748281d5c7a0f021f2d0a921ae47b16ae3f0313e9155c3c3492285ea22b627.webp)

![](images/19bb560a0e06704f9f43c1f1017ddf6a35778c90e33f857e58a7e0f0458d26c9.webp)

# Trouble Code and Symptom

![](images/4348d5a4696b4795e92435bed6562827f403dea3d25b37b929fe454b6fe0eeea.webp)

![](images/77eaf5cfec7c02d6dd5dc46299d9220a081833739290cbdeb3a4a14488a76ecb.webp)

# Diagnosis Procedures

Fuel Injection Bank 1/2

Check Injector Wiring

![](images/f860410a7f372a41bdd71a7ee720c8b5c8b81cc31becebf27b3e24abf8a48239.webp)

![](images/17437df66963fef115ddbf320321f0f1e7457faeb356a66750390806a114bd8e.webp)

![](images/f8b567c2303d4a4406063464c49eed4bc7bd8391f0de3e4af8bc3260ec9c1ae0.webp)

# Trouble Code and Symptom

![](images/32017af513f3b535f3ff5f8efc30ba980b03c5efe672413b981b4aa9a28f4810.webp)

![](images/8fd364c2ddbca851f293eab6af11c9a7b7904696686a06c9424e18ec4db819a6.webp)

# Diagnosis Procedures

Fuel Injection Bank 1/2

Check Injector Wiring

![](images/216a992c7343e3c679b71a9bc5bf80a6916cedcfd53fd1ca88202222b5acd349.webp)

![](images/adc7440a6091725991d747f5a92ddb7be8f83a9c297db2d0ce9c0be2edeb5451.webp)

Cylinder Balancing Fault (Injector #1) = Clogged Air Intake System

# Trouble Code and Symptom

![](images/1e93276bd35b89ba32843d8fa081fda0d6956b957d9fb2359578fd1cb6be7d81.webp)

# Diagnosis Procedures

![](images/9cef326a45950dc81a571a1cd908d1c475ced320d7b2b61b3b3157fa29dd2513.webp)

![](images/8a70c3f739920aa19d20e0d385109ef394c35c39f3cfe0d375e3a48c6237804f.webp)

Cylinder Balancing Fault (Injector #2) = Clogged Air Intake System

# Trouble Code and Symptom

![](images/9d32b0b05440e0871b0970d8072fe0cf1fc51f40733951add3dd5808a852c325.webp)

# Diagnosis Procedures

![](images/7c783e850a115e0fdcfbcfb2b0f439dd7a6d2c61e419f968328dc52005df25a7.webp)

![](images/77896c47f2e3d8cf5f1278ba3d0ae38482eae2dda1585d6ffa2919afcd4cd310.webp)

Cylinder Balancing Fault (Injector #4): Clogged Air Intake System

# Trouble Code and Symptom

![](images/d0fabf8f2daabaa28f32017e3a535bedd820b70ec256acc35671162bdd3c3830.webp)

# Diagnosis Procedures

![](images/7d7fcd4980f1a98724b463f5ab620dcebb16bbf88e82ce929f87a9169761da1b.webp)

![](images/9d85ad2912490456d11d55e92c95f508acf6776de6c3a84bbe2f4800057275d3.webp)

Cylinder Balancing Fault (Injector #5) = Clogged Air Intake System

# Trouble Code and Symptom

![](images/dec70f5c0e804c75ed0af2d1170b4894e840c07e0d3b0e22705083f46a68a8d4.webp)

# Diagnosis Procedures

![](images/9de1f0b5adf2f722b4dd86728b59ffc277c9f377679d46e34c5e24e8f53e2d19.webp)

![](images/b475755b7de4a617b5d27a64eda563b38fce1db580004a7e81e450ed93a8a5bd.webp)

Cylinder Balancing Fault (Injector #3) = Clogged Air Intake System

# Trouble Code and Symptom

![](images/b93fa168d79d0e263c9aa517e203ccc765e8c14784a479b0bcbe4436583adb69.webp)

# Diagnosis Procedures

![](images/ace9514811fb500cb14f968158d46acb61c8e4c17242857c718cede2144f8e09.webp)

![](images/a20306841dd5a18d4931a86d336f7d63e3453321aebd221255a66066351a55a3.webp)

# Trouble Code and Symptom

![](images/7270bf51a87ba782dd86d1c951f8e12aaadad8c71092f09c099beba67f0e50cb.webp)

# Diagnosis Procedures

![](images/ff3bb2e61a463f86708c0410168963a497bb26c94cd8f416f97424fa63284859.webp)

![](images/fa6629e2addb7efb6f6413c01222627ca64a2a74966a07677b22e5a9debbeb63.webp)

![](images/6731d01cb94bd8a4a44cafee3e948ac19bdb4b532f66d4499b440b18b35c1858.webp)

# Trouble Code and Symptom

![](images/4434c95eae8239a63f310c94607042e1a181c58c95250f72bdfc37b9123e1b03.webp)

# Diagnosis Procedures

![](images/8c0679e8406a34e249b1ee7ed31246da676e10a6effacaae68154bccbc43f65a.webp)

![](images/ac6034d253a59cd9e470253010539ea1d6702f94fbbb587f761b949b635a66d4.webp)

# Trouble Code and Symptom

![](images/42820b6626a9099e661663d16d1d12add726ab7db1d0244f4ffa8689d2fbee15.webp)

# Diagnosis Procedures

![](images/fc75006a8f12f413af7669ceabc89cb70eb98d90e6b3068eeaa911801c6feaac.webp)

![](images/63e685edb554b573407e1d28e9e923f7cf6be38ff5e70df547dd6f716a7085a9.webp)

![](images/e9b5bc603338b71b417bc50f63a3a354ee0a04a00d4deb6d6dad2740c390a054.webp)

# Trouble Code and Symptom

![](images/ec1a823b71ef586f591f0664ccc4d20bd7d880e35b0fbfc53ff5f5e239b44332.webp)

# Diagnosis Procedures

![](images/c30304e105e0b7aaae9fb0629fdcc3d0f641de671c87252edb227d8085b50e21.webp)

![](images/90ea617fdc3b8cf29aef2669d9f39da4f3f491dad4c34d67948de8d1bf8e08cd.webp)

# Trouble Code and Symptom

![](images/ce86bd4623b6dc000a9db71dc5838150e89f6f58ddfa3c64212800a04d35acf7.webp)

# Diagnosis Procedures

![](images/f84efabb483bdd81bc1a7d91f4894515a106a394926f0d05fa1c14ef7b23e8c1.webp)

![](images/01e0d1f0cb57b4a93f6229aac9c077fd8a9f95d68908e15d950aaa0bd153773c.webp)

# HSD Circuit Short to LSE (Injector #1)

![](images/1ab22b487c7a4ac05e0e46839442c493e25be7eb210783827ae09b032686f888.webp)

# Diagnosis Procedures

![](images/6b58c7942d31a2274bfe3dcbf3006b9902cb634cb3d0b01a7595eaa0bae6760f.webp)

![](images/6814ec6f20623682c323ff89a7634c00157b9105e82ffa91b99276b4c3c0f28a.webp)

# HSD Circuit Short to LSE (Injector #2)

![](images/bb88069c882588f3a190d7f6b6f218fbe304e1aa12f38b7ec82584c42d91bf3f.webp)

# Diagnosis Procedures

![](images/07a4652866e46bde2b71eaae52045a78d3f7adceb6df2d5ca1b744f5445ffb8f.webp)

![](images/034a445aeb8182120f49e8fcd0967af5be7ce09c6d9c75f43919ba0454386d75.webp)

# HSD Circuit Short to LSE (Injector #4)

![](images/ab1894491e61fe67496cb96f9c9eca1bc5631ab0d036215f46aea74f4f18c661.webp)

# Diagnosis Procedures

![](images/0eb7fe1b3b29d9a74485e4c92ff59c104a430fc628bb3aa9505716afd8b6fc20.webp)

![](images/9f606e03c7750c0085be5575de399d9046fa45ddb02b673205689c0dd37df04c.webp)

# HSD Circuit Short to LSE (Injector #5)

![](images/9a5bb64202715d7a0e6c5a9f835bb5fe644d03ae49ca000e67bef9c1e28ec8d0.webp)

# Diagnosis Procedures

![](images/ee28ec4290396acf379f5187074c28ed22b2b5b32ac6fb578aa9b7bf4312674c.webp)

![](images/12eb44673bbaca0e3f131efc2307177a3581d2674aed1c0949468b35bdc4b89b.webp)

# HSD Circuit Short to LSE (Injector #3)

![](images/b297f2a30e5cb8b313c06eab6c435afa7ca4b740056dcf04c0b54164b7b9555e.webp)

# Diagnosis Procedures

![](images/3d9724cc9e1c41c6f44d54171f8e4a631c39f4a02e82670506b6db3780fa81fb.webp)

![](images/4c56d95291a07b90320202bc797080e478b9e6127456ea7b1c155f766b51803d.webp)

# Fuel Temperature Sensor Malfunction

![](images/a524f101c80b73b3d4be3c1502609e3e034f52018ac6a970e5741ca6592c9e3e.webp)

# Diagnosis Procedures

![](images/502f77a776a8f110b73cc7e1fe1863378121648001fd8b72c9b6a6841cc4fb5d.webp)

![](images/de880707df7bfdd4049a56f3051034b6046df55a02759a88d5de5aad1b5e93c4.webp)

# Glow Plug Malfunction (Driving Signal)

![](images/82f7a081ec5476bb5ce27a23f00fac7045eb1ec98118d29863110a63e8c8af7d.webp)

# Diagnosis Procedures

![](images/24e4560d4210971a273d996fb00b76abaab2ff120b1067619daa482285f1bbef.webp)

![](images/a5313072b3dd68ac547746e5b4122f95637335db408d6be2999116c2fe4a4b28.webp)

# Heater 1 Malfunction (Driving Signal)

![](images/2dcad6f7162641b278f76ce40b3589da356f3cd5b38b59cfb9c795560942397e.webp)

# Diagnosis Procedures

![](images/4201ea60659b3516c64f1e2841f3e755bc16c8222fbe8125b1e9a82befe52f87.webp)

![](images/c046cdaeda70a83b689b8e8a2eec71bbceaca29068fa477c8c41792c7d202ebf.webp)

# Heater 2 Malfunction (Driving Signal)

![](images/c3b19b8b78d18f2e1b6844cdb2bb4223e9a8ed20850e4d8b8b8ab083fd8299b7.webp)

# Diagnosis Procedures

![](images/f43f5e5daa169a1c11c19905f07693eaed30057f2c11a1ae4cfe886d41373e30.webp)

![](images/27e7c2b6c296f93d606c893df2c235ec687c146c0dc2d3a4e14258c3722a7e87.webp)

![](images/5fab88a7b8623fc5e9ff6c72045001ecffa684f20c6c13ed5466e6c4b2268087.webp)

# Trouble Code and Symptom

![](images/68b57a2b85c5c079247264e347c4c9812221c1fde1e2e5bb157808145d044801.webp)

# Diagnosis Procedures

Rail Pressure Control

![](images/7b3f41edd5fbe8d319f0a42c21d9b8651473392549f4e3615fa52c19c2ad75d3.webp)

![](images/90b8b248adef2d12356abd33abfd1e89d5258725d6ba79021f1e1efb678e40ab.webp)

Transfer Fuel System

# 3 High Pressyre Fuel System

![](images/3470e244072e5b07af3c5c99efa69bc42c301770addfe92add0b4ead8af6fd31.webp)

![](images/afe3b6a29ec6366103b7b34100fd48b70353e570ee8f137017cd09fbfb8f6744.webp)

![](images/d1822f845358c64a370b7f1820d987165d961ee738419f62871107a063d0fdd2.webp)

# Trouble Code and Symptom

![](images/40aa3c7c7f9c054c495119b1fc245573a0cc071b65fdaa5515065b7c9afcbba5.webp)

# Diagnosis Procedures

Diagnosis Procedures (Rail Pressure Control)

![](images/2afc82d4dc00507ad54884be133d1cae7dfa500571099422db074d65444bae9c.webp)

![](images/2b2c19549ebd5f89ac84413b612d42ef16fd8c42b6a2b41e4588df8f0cbea3c4.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/64e436fc1a2affa71f18cc094e657bace06f664e9830ab0e94b1bf979c76bb85.webp)

3. Diagnosis Procedures (High Pressure Fuel System)

![](images/560b5e50c9a95136ea000343c1a5ddc0debb5b1c8f056cb2024899aafadfa6ad.webp)

![](images/8e5e8d8354807144ad2e10958d4b4d9bc7a07043c712aff0520157b101d4e98b.webp)

# Rail Pressure Control Fault (Too Slow Pressure Build Up while Cranking)

![](images/ecd457455b18fb86e2abb46a48fc4cca2e7cbac0c5dfa2cb3f10ac24159c8534.webp)

# Diagnosis Procedures

Diagnosis Procedures (Rail Pressure Control)

![](images/ea1cf0a37a9a4f7aa7caeeb4dc82568bc8e5939b19b2a81f2fa8ef9a68dca8ed.webp)

![](images/f68555b329fa57698e838e396d6bbc8fea9511dec1b679d21a51976cd25fb99e.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/709639aff6fc982b708d3e095de83d6e4a2d02008efc47965b3bb6e782aeb4e0.webp)

Diagnosis Procedures (High Pressyre Fuel System)

![](images/0fd337f3d34961bf3301f26976b37e23e88191dc12bdaf8df8f089b9b58cb32d.webp)

![](images/ba5937a29d9e6c2522395bdda2689a70dc9de89d62709acceb6dcfa3deaec8c8.webp)

# IMV Operation Fault (Electrical Fault)

![](images/269f420a63d515ef81167f4fe2bb63f41f796c5ebef1ef8f558c1c06503d31bb.webp)

# Diagnosis Procedures

![](images/b285ca78028e92e9ecc7350752b7c22603af707590904b204f072a69ac30155d.webp)

![](images/3206999224e06a0e259438139313b4b0158458ea6f847db328df60a44eea96bd.webp)

# Intake Air Temperature Sensor Fault (Electric Fault)

![](images/746c9b86b384652dda3ed875cde427820ab7e39ef572ee873440ea1949591e3c.webp)

# Diagnosis Procedures

![](images/979c086e81c21d844c96cf4565b6d388000eccc8427274028ad121b89226e759.webp)

![](images/47d2fae1eead7dced470985361ada3d8477549e90ec28fc55000c7f34a9c50c5.webp)

# Trouble Code and Symptom

![](images/51af301bee3d0f344756d389359eab80259f155bd7dcc5a7926b37e0dfe400b7.webp)

# Trouble Code and Symptom

![](images/e03d52317038b3478b220af20bcfde047e09cde4697e6fccc9e83d35493623b1.webp)

# Diagnosis Procedures

![](images/3c6cd5395172b7ab8c405ee8fb025f5732c83caaf3eae6348710b86ab6d10e73.webp)

# Trouble Code and Symptom

![](images/8ad28f6a5e851b06973b87b9d883425b1b89925aab6dbc491d486311071c412a.webp)

# Trouble Code and Symptom

![](images/eee53167ac99428784c1f6086444baefc38b16ee2daf7534fa133f04abab4fb7.webp)

# Diagnosis Procedures

![](images/79f4f570270ca1aa54d179f2f7180ca64dc32a6eb0e7f74d04b0fd08e604c095.webp)

![](images/035eb1799da5569d15fe162991d893fdf29c89d5625e91c7ae400a231664efec.webp)

# Trouble Code and Symptom

![](images/8ec627da8fefa615eaedd1b4cfadb8bf1c2d89faa096009bfb686e982f0750b5.webp)

# Diagnosis Procedures

![](images/8c615f9413eeb3c733e94bccdb909a8e1da4e530ebf4dc26fc62a36fa98635bf.webp)

# Rail Pressure Fault (Too High)

![](images/9d2bc310a15784d52ae406e24d16002a0e52f4879e9ab98f38d70cdfd87a0fef.webp)

# Diagnosis Procedures

1. Diagnosis Procedures (Rail Pressure Control)

![](images/9bd1629b1b1b9e86379b925e48891e38c620348b5d9ecb9d5c612015e3db5484.webp)

![](images/4aa54d533d24fc422a48487abebcab31dd4023887d641290567ff2dc55c788dd.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/83c95fc6e7c6a72c0fa2d667f7eb048f9b6dc23a4d1a934820a777d4d3bb0500.webp)

Diagnosis Procedures (High Pressyre Fuel System)

![](images/f0802fc2628e47c79169820be058f39aa24cfd58d60610f26b8c8e8ade0f613e.webp)

![](images/88c50f6fff178182b764f7a8fed83be1ffe12b6b7e798d30ca46577d6d10da6e.webp)

# Accelerator Pedal Sensor Malfunction (Relationship between Track 1 and Track 2)

![](images/e08a71aa0eca1ff2c26ab60109305c87f6db0b538b4cf625ef394cf1501da580.webp)

# Diagnosis Procedures

![](images/3a5c2d7cd0e8ea8acadec4440e8c74f6e8200a59a7a9c81981e8b6bf8e16b67f.webp)

![](images/850673cd650a1fb66860c3475ba9998d71b871c02371045d9d796c5ddd20a72f.webp)

# Accelerator Pedal Sensor Malfunction (Limp Home Mode Operation)

![](images/b583c1f55ab4449f325da0ae8668b6570d6bc913be4a8e59ea25d8e46c54cdd1.webp)

# Diagnosis Procedures

![](images/5c6f2d7f00a113a00d415586a6c5faa599479f9f0290868b464411471fd12081.webp)

![](images/0181b71730fc91ecd625e17ac7b992c77dfafb1c54ad11ca5bd057bbe955e73a.webp)

![](images/3ab1ca8143499e9458dadcef8d058902e1ba39733470a21768a2067725e1c8b4.webp)

# Trouble Code and Symptom

![](images/5ad9d7051e3a34b596bc29214d172f16e86fc8e7686a3bb16d987c66d0e3e40c.webp)

# Diagnosis Procedures

![](images/2439ca927bb74891a820f06d09a69df3d79006d80a3eccc71a159de2396b40c9.webp)

![](images/317700a070a665494d6bb0f58ea5a73db26cb908034f0d391363d094359081bb.webp)

# Accelerator Pedal Sensor Malfunction (Electrical Fault, Pedal Stuck)

![](images/2d0c958bfa412b3115c8257f1a0f46d353193545f8449e612e828c21f186a174.webp)

# Diagnosis Procedures

![](images/b085adda1334a709955ca27432986b086570ae4c95e3daa51e28ee371a85d0fb.webp)

![](images/43623afbe2ebb81b50e2fb4caeac92b7f04f04d3142fd8bf171ca6cb7b698fd2.webp)

# Accelerator Pedal Sensor Malfunction (Electrical Fault, Track 1)

![](images/18f744a9db9680a6aefb7f9cda125f3a5d5b9c55a1a46c9922981e731f6bfc37.webp)

# Diagnosis Procedures

![](images/16eee7d6e37efeee17884f6265b0fb73b56e295f58b761480d96332b37548373.webp)

![](images/2f507617d4a0c022fccbd4089c7a36e1c7f1f4717c3826f282d9cf1c841a180b.webp)

# Accelerator Pedal Sensor Malfunction (Electrical Fault, Track 2)

![](images/946aeda0ef622e8471fbd9f11c54e88893d58030facc52c6b5f81fd1043ffa71.webp)

# Diagnosis Procedures

![](images/ce20a6292ee094908f07f51f8f75e3e5f17d8afd4d5026683b47cfe176445b2b.webp)

![](images/522286b41e6cb0345c54f79a78c4140e309c45ca3987ab890eb2225448b49a63.webp)

# Fuel Rail Pressure Sensor Malfunction (Out of Range, ADC or Vref)

![](images/b9e0740e08cff20ac4671a6d59bc3bc6fdb084d004d7b05dde29ac79013eafef.webp)

![](images/0e52076c5fd50db87e0eaa56f5accc9c340d1a4fb93f65e0588affb1ffcc023b.webp)

# Diagnosis Procedures

![](images/9b1c1278d50d9dfbda9687b046db8fce87953775991a5a0d20cd37f9fd5995d2.webp)

![](images/c3bbce2accfd22337cb13b733412464e1bb0e0174032b6a154cf789fd6dce893.webp)

# Fuel Rail Pressure Sensor Malfunction (Out of Range when Key ON)

![](images/cd7776ff7d193ce3202c08aa327d1470910caf5faf367b9091f33a5e3bcb058a.webp)

![](images/ebcb54c9e9975bdb72175c127d2d9a96b7e7dc3d5a6cdb21ae44654ee6de1598.webp)

# Diagnosis Procedures

![](images/c5e5e6da2a075ee819064a247e04eeb3d93e9c83498bfc21a3ec06a57c2a4738.webp)

![](images/abb0b4280098628f0a72cbbfce551d480a0385f223c4a961c99c4aaae912fd25.webp)

# Trouble Code and Symptom

![](images/a5e83b7cd7425fea8117c956a0e4fb8382cb1e04b05ed7748a47981d06efbe66.webp)

# Diagnosis Procedures

![](images/f479ef3715b41c90cc66ea3bfa2f059043ed6bc5ef9570f33288d770c87aa132.webp)

![](images/aeab859fc4e92b18bf30b5d8d05dec0eaaab02011926d17d6a031eaec0c90b0a.webp)

# Trouble Code and Symptom

![](images/f067cc89aa3d2eba37c08480319a49a2c0ede77dbe09de3b25993c9b4fc738f1.webp)

# Diagnosis Procedures

![](images/24e0dee337a8cd603279bd9cf47cf7ea7bb8cdf53e0370ee898869c78f0ca4aa.webp)

![](images/501463edfd965207b214bba8f715890666d5f11a7d4398435dd26569f42d1bbf.webp)

# Trouble Code and Symptom

![](images/4e340a258f29053824bf8acf7d6a415ca10936d80d88696776defc1bf8572bf4.webp)

# Diagnosis Procedures

![](images/ded9e99de8b897740afe88b2693070236796d5917c93d591012c3243066081e3.webp)

![](images/840001ede21cb37bef3b86ed3ad56a8ebdcb333d1d2ec21097a120f93524ac02.webp)

# Trouble Code and Symptom

![](images/06560351b06c956bcd1818d50f49d452f6f9cb331b93fba90727e424658825af.webp)

# Diagnosis Procedures

![](images/b02709bcbf43b2ef0bf2a734f599cfaa1c81b60d853777074fbd2c407e76299c.webp)

![](images/3a47d21fdb1f8438f62be8db3a7f7c353f3b067b14cbd205e929d36239b2a03c.webp)

# Trouble Code and Symptom

![](images/1922cbd8f946f20dd7230e274e3741dc48e256f8f8f4281b33f6a465e2783245.webp)

# Diagnosis Procedures

![](images/603f00f0041f2a9a3a3ee2f90035363c6e652ebf47046721bb83e732bd2cace2.webp)

![](images/ae2ce28e60a5539e73f4f7e8cf4ba22b19d82a4e62464f01c47f475160f093eb.webp)

Turbo Charger Actuator Operation Fault (signal)

# Trouble Code and Symptom

![](images/c538dfcd47778ab4b9c8cb63f529dfe784b904903ea9888618a136bb58adb370.webp)

# Diagnosis Procedures

![](images/212869eed39c6299e4b335478056ad7ed09521da5433dc375f9d8eb680933fe9.webp)

![](images/27df63d8b345d4a3b985102055ce9ad2e6eeccecbde3606b7ad01135b740c8a8.webp)

# Trouble Code and Symptom

![](images/ad6bdea52fd24e4cbddd528d4c5a8dae4693a44fef9d796d14bbed2080ede66f.webp)

# Diagnosis Procedures

![](images/edefa031e293665f5612b4fad1e9335710cbcb4a02dd87a0cbf0a909b94b7dc4.webp)

![](images/c707df36710244c9aed52b8a8c1593f97b141ddcc07ca3b54f3ea3760a52c82a.webp)

# ECU Watchdog Fault (Injector Cut-off)

![](images/ee0e9f2c5246bb5dbb2f0395b8035edf4acc20fdde5c337251a8f33365cf7727.webp)

# Diagnosis Procedures

![](images/28522531f05d488540c6d88f1f8b9f162d840a189b1651fb4b90777107b98d88.webp)

![](images/4089dd7a59fdf2ada5beea03fd84b482b127304619160c96bc1b454291e8a6a7.webp)

# ECU Watchdog Fault (Watchdog Trip)

![](images/e6dfa90bef46f7bb582f5c9b13f92ce55df87747d8ac6197cf17ab208fec676a.webp)

# Diagnosis Procedures

![](images/f30a6d8f84b8fd931e0de855836d64f6fc7210343db9b14278487c6b0e48a89a.webp)

![](images/331da09870e675bc427a8b6b04b5f81835929ccbf4dd9adb9d644a67053c6981.webp)

# Trouble Code and Symptom

![](images/f28c39258c6066f11e73ceb08be273f3eaa83ea5c98f585e82bbaba1564071ae.webp)

# Diagnosis Procedures

![](images/c7d19ec19fcd5d144b4f18785c0bf378a3c4d0319cfbfdd4cfa3bf2b9021c29e.webp)

![](images/9c9bba853fd7cba2ea3303493a4171a370cb63d1ff169553fd6202c3df7350b1.webp)

# ECU Memory Integration Fault

![](images/33f7856e18f84aa8988a9f0406ab07b9098cc5e6d8c4e2f2bf6415290b89b7a6.webp)

# Diagnosis Procedures

![](images/c6753c40999ea3b424f574575657236715b8013506ff6a0fe6c25bf54d31ee3c.webp)

![](images/63877875bf37c5dfd33c42cd7736bc8973a2b9778f774407dfafab94515846ce.webp)

# Trouble Code and Symptom

![](images/770ae72d3a4cb94867905ecee4473084003615f770ab69c01a87fd9fdbda55be.webp)

# Diagnosis Procedures

Read DTC YES   
Knock Sensor Related DTC? — — Refer to "Accelerometer (Knock NO Sensor) Diagnosis"   
Vehicl driving conditions are   
not satisfy with MDP learning requirements

![](images/f1f50fdb071085e9502999bc250247fce546fed73741d7916ab2a1abfc602bd4.webp)

# Trouble Code and Symptom

![](images/c1b91d509a1d1f37246f7bc7b7bfe228c20911759da8e0feb463ecc934650532.webp)

# Diagnosis Procedures

![](images/c8fe7440a2fa2770d51af646903aa943ffba8a9eab0c34a81941bccce51dbc7d.webp)

![](images/8a367cae2486d25b03fe37092a1cf432ee69fc50bf57a6346a1ef785a760745e.webp)

# Trouble Code and Symptom

![](images/abfebe7a28ac6d2cb79763b5b209855cd5a944c937d9246684ef9ea0907b01fb.webp)

# Diagnosis Procedures

Diagnosis Procedures(Boost Pressure)

![](images/1d08fe05ee0c6250452bac3e3127313f1cff26c4b22b9567373a72eca89c2a2d.webp)

![](images/03d6bbdac50d58dd3d49b33778a73dd8844a7f0dcea449cedbfff109e8c934ec.webp)

Diagnosis Procedures(Check sensor (1))

![](images/ada411354d5d239ab95483929bac2a3dbd56f25feb4ed9fd040863080db8e4dc.webp)

![](images/9a5f02781cfe0e68445d0d3c86bf1ee5bb9ed33539ca8229131387a8bcd0dd89.webp)

# Trouble Code and Symptom

![](images/e5c7617e97939f3e6967a6bb2774d07e94c3ffb6f3bc76bcd2b035f4437b5fe7.webp)

# Diagnosis Procedures

![](images/fb67a76e11652c9f00d3a5eee43e1ba4ae975997d6f7579ae3ce5487145600fc.webp)

![](images/06eb1aea95f9b48c4b24d72043426901f87b12cde82b931bcb63d1f5c5904050.webp)

# Trouble Code and Symptom

![](images/149fb8747ffa43b7f80aeaa68448f4b0a9b479b4ae5afac2d54f6d3f99ac0d36.webp)

# Diagnosis Procedures

![](images/09163fa29e7f42fcd27ec0a8ce3de14f8cc2b2e0619d27009efb06b8ee9cac02.webp)

![](images/331b293dd6e83709b68c64085b01df1d634af1ac7620c93374feaf3a26e1dd47.webp)

# Trouble Code and Symptom

![](images/44bb5bbf85d74b3e8912c26c6ab15af91f77a9e47b5c3789bc02c12f29cd3ed2.webp)

# Diagnosis Procedures

![](images/e7f5ea61383d1a3e09ed8f2430dde1eabd3aa7396a945830069581fae6c021e5.webp)

![](images/3780835e92cdadfce859479a6fe7cddec1cfc7d01c7fef5244b02d0877a0af4e.webp)

# Glow Plug Module Communication Fault

![](images/6ccf2a350b89e84086cd90bf69a687fe6d94f1ea5c251c14876fd84f5aed38d8.webp)

# Diagnosis Procedures

![](images/7ade1e6675fcb7fbe3916e6e2d7fa8878544ade22cd709f2eb96d7fbaa7c2584.webp)

![](images/17e5ac05f6c58e54e858969b126bf96245056c2607fda1a0880f85501613841d.webp)

# Glow Plug Module Circuit Malfunction - Open

![](images/32750a7e694defbbcaaa1afbafef6ebbba9070d709c71fc090ae2a9ff65e7e06.webp)

# Diagnosis Procedures

![](images/f77d7ef84dba3e7fdbcd7682f56718fa9691f0ee2828afea7cd07d1447381f8a.webp)

![](images/01aedc22445339a51e29fd9d5b9f1d8caa459f43a72b92d7861c73bbddf8aa79.webp)

# Glow Plug Module Circuit Malfunction - Short (B+)

![](images/f92f15ef50acfbca538b5543130f073e7f0cddbc957caf46721d0ee972a1f2e3.webp)

# Diagnosis Procedures

![](images/562429c734b82b17890b16badd4fa66c20eaa3afdd836afdbd1283405b152690.webp)

![](images/7f341facc54ceffd896efe394f7312e4a53709118064869f3341dfa8035dce52.webp)

# Trouble Code and Symptom

![](images/ace0872ae9358ff23f0143be7d97d9081a7a570d4556c6fff836dc45a7a09365.webp)

# Diagnosis Procedures

![](images/fc2b114227c04f043869874257d04a6ba8557cf07611bafdfc7742e64bdc45e6.webp)

![](images/f98e91c2cf0e7dacaa6855175d05b4d0d70e9b0f708ae974d59a394bde8872ff.webp)

# Air Conditioner Operating Circuit Fault

![](images/9d6033608921af1d9c32035d671a6e488b88c60473251f0152aabf299634cba4.webp)

# Diagnosis Procedures

![](images/e78ef799c6e3180765e614d52a4622c25837aa166c52680c86c299b3b7f34ff6.webp)

![](images/99365af206630dc9a8dc995aa42204172232e78db7394015ea2139e1df5348db.webp)

# Trouble Code and Symptom

![](images/d058d149d245fcf84a3c277b85f86bfb68587668ad3252b086e546347440c58f.webp)

# Diagnosis Procedures

![](images/ce7e9797cf2f858da016bac6b27301f2f1231dd4b57d6ede4c2f170839770519.webp)

![](images/8fbdd9e5e213fb13785d9422996f6970e49121c3a784cdbfb506546fbfb4b92b.webp)

# Trouble Code and Symptom

![](images/5635bc9bfd024954a3e38b75468ac0ee7bd4a07d2169914432e630bb9b603142.webp)

# Diagnosis Procedures

![](images/cb6c201002db39e1b2454a4739024cfebe9aead45594571a089c5dd5ec701619.webp)

![](images/ca754673997f98cd21c07b169bd3eeca7745f3e7f08bb75e5512c06cddeff336.webp)

# FUEL SYSTEM DIAGNOSIS

OVERVIEW .. .. DI10-178   
Fuel pressure system DI10-179   
Fuel system pressure test DI10-182   
Fuel system check process DI10-184

![](images/71df3fe68ee5385e063b3c2ddb2a9b966c754ec20a07dc9c4e6a5559ce3eae12.webp)

# FUEL SYSTEM DIAGNOSIS

When the Diagnostic Trouble Code (DTC) is detected through scan tool, it's necessary to check the transfer and hig ressure fuel lines in fuel system before replacing the components.

If the trouble continues even after the trouble has been fixed with scan tool, must perform the fuel pressure test.   
Below schematic diagram shows the specifications of pressure, flow mass and temperature in fuel system.

![](images/6a315726027a24f0dc43c0f9b274a066d126fdde486fdb746a0e06fd2d82e69a.webp)

![](images/67d83765bd3d98b864ab624e9084d6684098de8db70fe3d1a5db461ef7de4d9c.webp)

# FUEL PRESSURE SYSTEM

![](images/9e54bb16458e1631f84363da6bb65a86650f1d7b2de1bba7103802e942df904d.webp)

Y220_10063

![](images/6d45f25794f53572e339a3791cf8c01331b1728535715e5633eb9c2a74cf4a48.webp)

# Example of Too Much Injector Back leak

![](images/e6bc3b310b41cd0d05db1e014f630bca3b07d4d4b148b8e337d76fa60530fa7a.webp)

Y220_10064

# Too Much Injector Back leak

When the injector cannot be sealed due to entering the foreign materials

# Ex.:

• Foreign materials in fuel •Burnt out or worn high pressure pump •Mechanical damage in inside of injector

![](images/d542c90b148d61efdf001a65a4f2af04d9d2e2d9988724525267a746ba3229f2.webp)

# Example of Pressure/Volume Loss in Pump

![](images/d1ad6c5e811eeab0966a5802af5ddd41173803ce0b548f5d201d9b1eac2748b9.webp)

Y220_10065

# Pressure/Volume Loss in High Pressure Pump

When the required target pressure/volume cannot be delivered due to fuel supplyline or pump damage

# Ex.:

•Air in fuel supply line Excessive vacuum pressure in fuel supply line (-300 mbar) •Burnt out or mechanically damaged pump •Supply fuel with increased temperature ( > 65°C)

![](images/c877bb798472b540120261f1577602953788871699f89c36783de3080e3d56a4.webp)

# FUEL SYSTEM PRESSURE TEST

Test Tool Kit

For High Pressure Line

![](images/61c3c23399ab0399bcc1d11b04ecf5d62e43926dcbc544b7eb2bca69bc54123e.webp)

Y220_10066

# For Transfer Line

![](images/d06601555c30503c6a6486276f149975e9ebdb74cd72d921e6879d47718dec2e.webp)

Y220_10067

![](images/db5870edd9bf8ed24e0112e980a5a842d42fcd64939e1b223c0b1938fcbd69ab.webp)

# Prerequisite

1.Check the connections in fuel supply lines.   
Check the fuel level in fuel tank.   
Check if the air exists in fuel supply lines (air bubbles in fuel supply lines or fuel with air bubbles).   
4.Check the fuel supply lines for leaks (transfer and high pressure).   
Check if the specified fuel is used.   
6Check the fuel filter for contamination and abnormality.

# Fuel System Test Process

![](images/7c145e03614c5ec7e72709e3f251bab3e209af670c44858c87568c31437f3b37.webp)

Notice

If more than one DTC have been detected, check the wiring harness for open or short first.

Check the transfer fuel system and fuel filter before proceeding the high pressure fuel system check in next page.

![](images/a475642d173ee6a532cd600ab26dd42e2425080b74b7d0d4fc8b50026d909750.webp)

# FUEL SYSTEM CHECK PROCESS

Initial Check Transfer fuel system (air in system), specified fuel used Fuel leaks, fuel filter Diagnostic Trouble Code •Wiring harness •Abnormal noise from injector No Abnormality No Check and repair in Initial Check? Yes Check fuel rail pressure (refer to 4-1) When cranking engine for 5 seconds after disconnecting IMV connector, i the rail pressure over 1,050 bar? Check transfer fuel system (refer to 4-2) Yes Install the transparent tube between fuel > filter and priming pump. Check the transfer felsystem for clogged oir bubbles. Check i the vacuum pressure is proper. No Thoroughly clean the components before installation Check the injector back leak volume   
Method 1 Method 2 Static Test for Injector Back leak Volume Dynamic Test for Injector Back leak Volume (refer to 4-4) (refer to 4-3) (with engine cranking but not running) 1. Warm up engine (coolant temp.: over 60°C), place an (with engine running)   
Place an empty plastic container under the return of empty plastic container under the return of injector, and   
injector: start engine.   
Remove IMV and injector connectors, crank for 5 2. Run the engine for 30 seconds at idle speed, perform :   
seconds, and check the injector back leak volume. fuel system pressure leakage test” with Scan-i, and   
The fuel length in tube should be over 20 cm. check the fuel level in container. It should be over 38 ml. High Pressure Pump Test (refer to 4-5) No Install the closed rail into high pressure No pump at outlet port. Remove IMV connector and crank engine for 5 seconds. Is the presYes sure over 1,050 bar? Yes Replace the injector Replace the injector   
Enter new injector C2I data into ECU Enter new injector C2I data into ECU after replacing the injector after replacing the injector Perform the initial check again. Yes No Replace high pressure pump

![](images/5f7ceacd11795a840c0e1549d1306623223adb75faf9e7bd6b7f6077cc104b80.webp)

# 4-1. High Pressure System Pressure Test

1. Disconnect the fuel rail pressure sensor connector and IMV connector.

![](images/b12ef1af020f1829c8da89baa2102d427625875b3ab90c422ce5eb357283b4d8.webp)

2. Install the pressure tester in tool kit to the fuel rail pressure sensor connector.

![](images/f4c067338f3692cac2486d4163bc0faa11c74b1d7f23eb8aa0bc7f1950565699.webp)

Crank the engine for 5 seconds (twice).

-Read the maximum pressure displayed on the tester. -If the maximum pressure is below 1,050 bar, refer to “Fuel System Check Process” section.

![](images/b63051cc18933e1d8e4de8659d1e7f90ae2bab40050457d52cb9e176433f4030.webp)

![](images/1f2b6a410b3dfe1ae466809cee7ed181fa9ac92e7b1b48b7cc8de55370865be7.webp)

![](images/c42060c1d37af5d096ea949079d08877c19a20f309b9a9bb88070d213ea187ae.webp)

# How To Use Pressure Tester

1Check if the “TEST?" is displayed on the display when pressing the “Test " button.

The maximum pressure will be displayed when pressing the button while cranking the engine (around 4 seconds elapsed from 5 seconds).

# Note

The fuel rail pressure can be measured through the scan tool.

![](images/0c364d65fe2d8282545a31734d560d6954ca7bdc53a3e1a0548e295a80813d25.webp)

# 4-2. Transfer Fuel System Test

1. All wiring harnesses, connectors and fuel lines should be installed properly and the engine should be ready to start.

2. Prepare the special tools for transfer fuel system test and thoroughly clean the system.

![](images/823106fb3522be256fe8f0b18f5b62acd411e21a1456b077108cc449b39d8282.webp)

Disconnect the key connector for connecting the priming pump to fuel fiter and install both connectors of the special tool to the fuel pump and the priming pump hoses.

![](images/e404028400042ef8ef8d12eb906cd66003702dfeea8592f8471fcf0f96cbe0f1.webp)

Y220_10074

Start the engine and visually check the transfer line for clogged and air bubbles while running the engine at idle speed. If the fuel flows are not smooth or air bubbles are found in fuel lines, locate the leaking area and correct it.

![](images/017141f2b3a427513c1fe8bdf3017501f5c2b2a950bb7e3ab4d9be250eafa3b1.webp)

# 4-3. Static Test for Injector Back leak Volume

Remove the injector return hose and seal the openings with screw type caps (included in tool kit).

![](images/bc02b9b868f7b2000c7061d4de1214320607a864711537796d0b7092ea2bc9e0.webp)

![](images/4f5e716b49345de898f0ac850593580025bba1b283ea71227c8400d0471f012a.webp)

Install the hoses from back leak test containers to return nipples of injector.

3. Disconnect the IMV connector in H/P pump and the fuel pressure sensor connector.

![](images/316617749ed081900aa8403e07095e7d7cb4f731f4b98a75771ead2fca4c14de.webp)

4.Crank the engine twice with 5 seconds of interval.

5Check if the back leak volume meets the specification.

![](images/f1fa920b557ad17d2330abc497f270cd2f29b2c2f4d8845b2a467f6180cac690.webp)

20cm 20cm , Y220_10079

# If the measured value is out of specified value, replace the injector.

![](images/e9954e11b6e24f970360bbb6dfea84ac5b0a4ab70b3a69c8046d536b7c3c65cc.webp)

# 4-4. Dynamic Test for Injector Back leak Volume

1.Start the engine and warm up until the coolant temperature reaches to 60°C.   
Remove the injector return hose and seal the openings with screw type caps (included in tool kit).

![](images/96b5e7dbbc99ef2ee6f952a60f17f48846e3975c27fd7ccda387fc1bff6324f6.webp)

![](images/9234b0b64fa456696f0b776c40532c8664378852331c287bc28a9e4e3c3dd7dd.webp)

3. Install the hoses from back leak test containers to return nipples of injector.

Start the engine and let it run for 2 minutes at idle speed.

5Check if the back leak volume meets the specification.

![](images/f18c914b4aa188f92654971d7436f3519480e310b0b81d3c10386f1a6fcadf57.webp)

4R.22 00ml 3F1. 60ml 2R.00 ← 40ml IRe 20ml Y220_10082

![](images/f45cf792ca2cfc2c1af29df594b97287123ff4d1e97d1d5a8dac11f2223daead.webp)

# PRESSURE LEAKAGE TEST WITH SCAN-100

When performing the static test for injector back leak Volume, the fuel pressure leakage test with Scan-i should be done simultaneously. And, the fuel pressure leakage test with Scan-i can be done separately.

. Test Conditions:

•No defective or faulty sensors and components in fuel system: checked by Scan-i • Coolant temperature: over 60°C

3The diagnosis procedures with Scan-i are as below:

1) Install the Scan-i to the diagnostic connector. Select “DIAGNOSTICS” and press “ENTER” in “MAIN MENU" screen. Select “REXTON'” and press “ENTER” in “VEHICLE SELECTION” screen.

![](images/bcebedec7b8a1986a8d8d1729aed8cc6664096f28fdc835f3b6eea57eca69a9c.webp)

2) Select “ECU” and press “ENTER” in “CONTROL UNIT SELECTION” screen.

![](images/3d310b704d2a3552ecc5626609a6c060c4153fc9775683c01c24c9aaaba23c0c.webp)

3) Select “LEAK DETECTION" and press “ENTER” in “FUNCTION SELECTION"” screen.

![](images/140402c241c5039ee08769e0f22fad759cee541abb46f2cee03a402a216f342f.webp)

![](images/29c4d4ce93d188732dfc93c619dfccbafb3b609ee47a3a97ce12347bc9752890.webp)

SCAN - 100 LEAK DETECTION ReXtoN ECU DSL D27DT > Test Condition <<<<<<<<< - Idle Running(Vehicle Speed = 0) - Engine Temp. : 60-100°C - No Detect Battery Fault -No Detect Injector Drive Falut — No Detect IMV Drive Falut - No Detect Rail Press Falut [ENTER] : Start Leak Detection

![](images/ab10f3637c74472a4fc7ef1a984439593ae0475c7619782613e2b07eaca6d88f.webp)

4) If there are not any troubled conditions in "TEST CONDITION” screen, press “ENTER".

# 4-5 High Pressure Pump Test

1. Prepare the special tools for high pressure pump test and thoroughly clean the system.

![](images/1a87dd5603da1081876160632ce00a1a1813c438451f0f8e47dd87fcdca90815.webp)

2Remove the high pressure fuel supply pipe and install the closed rail delivered with tool kit.

![](images/00e2a91cd3bea296d05474810f7a34533100ba6d7be73ed574ed9d507e013c8c.webp)

![](images/8279cd00a0480e228ea4bb8a55aa8d546dae40c52f53412984638937e83935ac.webp)

\* The figure is to show the test method. However, the actual test operation should be done while the high pressure pump is installed in vehicle.

3. Install the opposite end of the closed rail into the fuel rail for test.

![](images/e898fa459fdb621203f23113d1de9f191603f9b4329176d15e00973e50e620a2.webp)

![](images/05ac7961fd49e2405b4ba36cbf90068ede0e46bf655676b9cdc857996e91b15c.webp)

4.Remove the high pressure fuel return hose and install the transparent tube between the high pressure pump and the return port of fuel rail for test.

![](images/a37fb33e91427623a66f9211d6b02a6ae256de0a299de93902f6763abafccf81.webp)

Y220_10086

![](images/3e4e392703b6e282d5c93cb7f0a3e1ca8965ad683f9819cc591fb845be444520.webp)

![](images/9880e283b776cdd2ffa2654966ff60ca09edf867d08d7da908ddd60571c83831.webp)

5. Connect the digital tester connector into the sensor connector of fuel rail for test.   
6Disconnect the IMV connector and the fuel rail pressure sensor connector.   
7. Check if the measured value on the digital tester meets the specified value.

![](images/14f55b1ed9d68f7c6376c7839ed9dfdf0513c518ed052a86fc1c7a3d2201c663.webp)

![](images/0ef174e474568ec59635ce2b23349b2441462f05ebbc1a20479da750ba7f63e2.webp)

Y220_10088

![](images/667cce8db7ff916f937cfc337eb07ac27d8000f6d343bdd7e815aa0df3dc4f1d.webp)

ISSUED BY INTERNATIONAL A/S TEAM SSANGYONG MOTOR CO., LTD.

150-3, CHILGOI-DONG, PYUNGTAEK-SI GYEONGGI-DO, 459-711 KOREA

TELEPHONE : 82-31-610-2740   
FACSIMILE :82-31-610-3762

NOTE: All rights reserved. Printed in SSANGYONG Motor Co., Ltd. No part of this book may be used or reproduced without the written permission of International A/S Team.
### ENGINE SERVICE MANUAL
![](images/676f644fa2aa7be89aa761fbcf786af5065c8290e5b354532ff7bbec44b2d67a.webp)


### CONTENTS
GENEL O.DI0   
ENGINE ASSEMBLY .. I1   
ENGINE HSING.. . I02   
INTAKE SYSTEM. . I03   
EXHAUST SYSTEM. .. NI4   
LUBRION YST. D   
COOLI   
FUEL SYSTEM. .. .. I7   
ENGINE CONNTL SYSTEM.... I08   
ELECTRIC DEVICES AND SENSORS. DI09   
DIAGNIS .. 10


### Table of Contents
CLEANNESS DIOA-3   
STRUCTURE DIOA-8   
ENG IN COTLS  M-1   
ECU related components .DIOA-11   
Engine and sensors . DIOA-12   
Electrical components and   
pre heating system DIOA-13   
INTAKE SYSTEM ... DIOA-14   
Intake air flow chart . DIOA-15   
INTAKE SYSTEM . DIOA-16   
Exhaust air flow chart . DIOA-17   
LUBRICATION SYSTEM. .. DIOA-18   
COOLING SYSTEM DIOA-19   
Coolant flow chart DIOA-20   
FUEL SYSTEM DI0A-21   
Fuel supply system . DIOA-22   
GENERAL SPECIFICATIONS. DIOA-23   
Vehicle specifications. DIOA-23   
Maintenance DIOA-26   
VEHICLE IDENTIFICATION. DIOA-28   
HOW TO USE AND MAINTAIN WORKSHOP   
MANUAL ... .. DI0A-30   
Consists of workshop manual.... DIOA-30   
Manual description DI0A-30   
Guidelines for service work   
safety DIOA-31   
Lifting points . DIOA-36   
Tightening torque of standard   
bolts.. DI0A-37

![](images/39dad067d4084dee3b607803276284a00aa86a3ed6a3b247ca05dfe7bfb9cb65.webp)


### Cleanness of DI Engine Fuel System and Service Procedures
The fuel system for Dl engine consists of transfer (low pressure) line and high pressure line. Its highest pressure reaches over 1600 bar. Some components in injector and HP pump are machined at the micrometer 100 um of preciseness. The pressure regulation and injector operation are done by electric source from engine ECU. Accordingly, if the internal valve is stucked due to foreign materials, injector remains open. Even in this case, the HP pump stil operates to supply high pressurized fuel. This increases the pressure to combustion chamber (over 250 bar) and may cause fatal damage to engine.

You can compare the thickness of injector nozzle hole and hair as shown in below figure (left side). The right side figure shows the clearance between internal operating elements.

![](images/0025ba396af0a5453e198926e7883f530b7787382aba914a730b447e7087ed47.webp)

Y220_0A035

The core elements of fuel system has very high preciseness that is easily affected by dust or very small foreign material. Therefore, make sure to keep the preliminary works and job procedures in next pages. If not, lots of system problems and claims may arise.

![](images/35b0fa5d9535768980229fbfa47de8eff1791506c0159d2eb068d1a9ab5b737c.webp)


### Job procedures
1. Always keep the workshop and lift clean (especially, from dust).

Always keep the tools clean (from oil or foreign materials).

3. Wear a clean vinyl apron to prevent the fuz, dust and foreign materials from getting into fuel system. Wash your hands and do not wear working gloves.

4Follow the below procedures before starting service works for fuel system.

Carefully listen the symptoms and problems from customer.   
V   
Visually check the leaks and vehicle appearance on the wiring harnesses   
and connectors in engine compartment.   
Perform the diagnosis proceee with Scan-i   
(refer to "DIAGNOSIS” section in this manual).   
V   
Locate the fault. If the cause is from fuel system (from priming pump to   
injector, including return line), follow the step 1 through step 3 above.

5If the problem is from HP pump, fuel supplyline or injector, prepare the clean special tools and sealing caps to perform the diagnosis for DI engine fuel system in "DIAGNOSIS” section in this manual. At this point, thoroughly clean the related area in engine compartment.


### Notice
Clean the engine compartment before starting service works.

![](images/4fdca1d205b650207795219b8cfc38d34077de5042aa6348fb053534973c5d6a.webp)

![](images/101d71ee9aea88f7b0ecc79369973499372d816418a21866a51c360c0aca685d.webp)

6Follow the job procedures. If you find a defective component, replace it with new one.

Disconnect the negative battery cable. V For safety reasons: check pressure is low before opening the HP systems (pipes) V Use special tools and torque wrench to perform the corect works.

Once disconnected, the fuel pipes between HP pump and fuel rail and between fuel rail and each injector should be replaced with new ones. The pipes should be tightened to specified tightening torques during instalation. Over or under torques out of specified range may cause damages and leaks at connections. Once installed, the pipes have been deformed according to the force during installtion, therefore they are not reusable.

The copper washer on injector should be replaced with new one. The injector holder bolt should be tightened to specified tightening torque as well. If not, the injection point may be deviated from correct position, and it may cause engine disorder.

Plug the disconnected parts with sealing caps, and remove the caps immediately before replacing the components.

![](images/9dbbee8f6f336b294d94cae06410d58fe4900808678af50c72ecbedd3203e083.webp)

![](images/d34a742332a1650f91b52f14cf13309512b9ebef4714f29f22dbeb8ab89e36fa.webp)

![](images/8e27eb4462ec6f1c785624426657556086ce1f8c42b5c5db6ddf3ba5816be7b1.webp)

7. Plug the removed components with clean and undamaged sealing caps and store it into the box to keep the conditions when it was installed. Clear the high pressure offset value by Scan-100 after replacing the high pressure pump.

![](images/cab3ca0d8d19cd8db653cf405b9d4783f854488e1ad28397dc022497d0fbda99.webp)

9. To supply the fuel to transfer line of HP pump press the priming pump until it becomes hard.


> ⚠️ **Внимание:** Do not crank engine before having filled pump.
>
> O SCAN - 100 FUNCTION SELECTION   
> REXTON ECU DSL D27DT   
> 1] TROUBLE CODE   
> 21 DATA LIST   
> 3] ACTUATOR   
> 4] TROUBLE CODE CLEAR   
> 5] ECU IDENTIFICATION   
> 6] INJECTOR(C2I) CORRECTIONS   
> 7] LEAK DETECTION   
> 8ARIANT CODIN   
> 9] ECU REPLACE Select one of the above items Y220_0A042   
> 10. Check the installed components again and connect the negative battery cable. Start the engine and check the operating status.   
> 11.With Scan-i, check if there are current faults and erase the history faults.
>
> Note For details, refer to “Dl10 Diagnosis teable".
>
> ![](images/bd1da9e5ffa7f72202f53b0338241c5102b69cd933a79985d5fbd380c31c8b74.webp)
>
> DI Engine and Its Expected Problems and Remedies Can be Caused by Water in Fuel


### SYSTEM SUPPLEMENT AGAINST PARAFFIN SEPARATION.
In case of Diesel fuel, parafin, one of the elements, can be separated from fuel during winter and then can stick on the fuel filter blocking fuel flow and causing dificult starting finally. Oil companies supply summer fuel and winter fuel by differentiating mixing ratio of kerosene and other elements by region and season. However, above phenomenon can be happened if stations have poor facilities or sellimproper fuel for the season.   
In case of DI engine, purity of fuel is very important factor to keep internal preciseness of HP pump and injector. Accordingly, more dense mesh than conventional fuel fiter is used. To prevent fuelfiter internal clogging due to parafin separation, SYMC is using fuel line that high pressure and temperature fuel injected by injector returns through fuel filter to have an effect of built-in heater (see fuel system).


### SYSTEM SUPPLEMENT AND REMEDY AGAINST WATER IN FUEL
As mentioned above, some gas stations supply fuel with excessive than specified water. In the conventional IDI engine, excessive water in the fuel only causes dropping engine power or engine hunting. However, fuel system in the DI engine consists of precise components so water in the fuel can cause malfunctions of HP pump due to poor lubrication of pump caused by poor coating film during high speed pumping and bacterization (under long period parking). To prevent problems can be caused by excessive water in fuel, water separator is installed inside of fuel filter. When fuel is passing filter, water that has relatively bigger specific gravity is accumulated on the bottom of the filter.

![](images/b5866f517caee463e98ec41dd0bd86bcb44c4c6e5ca03f35ffbbb8af4aa06887.webp)

If water in the separator on the fuel fiter exceeds a certain level, it wil be supplied to HP pump with fuel, so the engine ECU turns on warning light  on the meter cluster and buzzer if water levelis higher than a certain level. Due to engine layout, a customer cannot easily drain water from fuel filter directly, so if a customer checks in to change engine oil, be sure to perform water drain from fuel filter. (See fuel system for details.)

![](images/0d3cfbb1bfc4685e2be168ea2a0505b0026879d9d0c7f745e880b34eda30640b.webp)


### Front view
![](images/a2415358f50c7d5d5a5c40e872addfc4d3ab07227dbeb905d4faf804c24e30b2.webp)

Y220_0A001

1. TVD (Torsional Vibration Damper)

2. Air conditioner compressor

3. Power steering pump pulley

4. Idle pulley

5. Water pump pulley

6. Alternator

7.Cooling fan pully & viscos clutch 13. Oil filter housing

8. Aut tensioner pulley

9. Auto tensioner

10. Poly-groove belt

11. Cam position sensor

12. Drive plate (M/T: DMF)

14. Vacuum pump   
15. Crank position sensor   
16. EGR valve   
17. Power steering pump   
18. EGR center pipe

![](images/fe58dfab9b317a797b7830611e84c5b95114921d189b865e6f9f07393cbd8d92.webp)


### Top view
![](images/1ba9587de37ab66850874c3faddb766a830bd7623174186e3860d5214be1d397.webp)

Y220_0A002

19. Cylinder head cover   
20. Intake manifold   
21. Water outlet port   
22. Common rail   
23. Fuel pressure sensor   
24. Fuel pipe   
25. Injector   
26. Fuel return line   
27. Oil filler cap   
28. Glow plug   
29. Booster pressure sensor   
30. Oil separator   
31. Oil dipstic   
32. EGR center pipe

![](images/c766e3ec4fd469047c23672ebaca39d1bc25f72dfd453501ec38ef83074e0c41.webp)

![](images/16755d2e01ea4882321b22f2ee452394a0b29f46a50686ad7421fea8866656d3.webp)

Y220_0A003

33. Cylinder head   
34. Cylinder block   
35. Oil pan   
36. Drain plug   
37. Turbocharger

38. EGR - RH pipe

39. Oil separator

40. Oil dipstic

41. HP pump

42. Turbocharger vacuum modulator   
43. EGR valve vacuum modulator   
44. EGR valve   
45. Exhaust manifold

![](images/107a71e9a01a8840ea9763ce5a68265620a9cf9a28d3be0023938d88dafe99e6.webp)


### ECU RELATED COMPONENTS
![](images/331d5f2f496dbc544f6485fc9ec2dc4f185490ced79c2696a1b9508585e73f1d.webp)

![](images/4b9c531920005af526d8c8776a11e2ca375240bdbd89390ee19a227d2c3c6e0e.webp)


### ENGINE AND SENSORS
![](images/6e7eeb14aaf20443ca87dbdcabb5cd4c57fd05894430985aee83050152c1347c.webp)

Y220_0A005

![](images/1c9a82a6ec37889714814ab80d0daf79c9175857667eb32f962f8db6702b9860.webp)


### ELECTRICAL COMPONENTS AND PRE HEATING SYSTEM
![](images/77abb0549e95a4619698e92e5e5968cdeba1581c86e5dbd48bfa78dd1f367bb6.webp)

![](images/491a81082f8eef904a556c3cf7acf3d1e85507fc108bd58afa875aeccaa155b6.webp)


### INTAKE SYSTEM
![](images/2f0078b0f94e801c64fe7047d73bc85e947b85a1bdf22aef5b2a7b674682bf7f.webp)

![](images/f27c239d301af145dc67f25ff225318c844b0f1e1c3e212dca680269d131fdc4.webp)


### INTAKE AIR FLOW CHART
![](images/4f636625cafd46ad92a88697b6ad8e4ec469f4ae010753db10cd14f22e9032b8.webp)

Y220_0A008

![](images/d2b86bb456592a08c920c31ba57d4ecba7c62b336d34daf3285766739493adfa.webp)

![](images/e7da09f5c4d98af673a860c21a3eb53eb7cd19b6d5cd863d688adcfa6af6a27b.webp)

![](images/9e621894a5bb0963956d7f899e51c15932e1677297737bbeb26aa3f154d82e33.webp)


### EXHAUST AIR FLOW CHART
![](images/f251df62ff5435ce075b1b33154af579967457e021e8ef3aa5f1bb9721b2716a.webp)

Y220_0A010

![](images/f6b3a1bb4aaaf8666b3fc6babbf0eca126f4d9c77221e087c21c8ee11833e781.webp)


### LUBRICATION SYSTEM
![](images/4fe78db9c1e2ff5cd393c55fadc66f009821a044175478e36d387a32aedc91b9.webp)

![](images/2b1fb1fec228b08afb04daee60e4ad83cb9b176f73a91d82a6a2b95e6c89959c.webp)

![](images/a31e1048c64690eba7845f40c42c50c6a293eb1d0d03a5997de960fc3143022a.webp)

![](images/911e2f682afa9dc5b651070bb820d6cf31fad465bd8fd05b153be0e37db8f7cd.webp)


### COOLANT FLOW CHART
![](images/50bd02f4cc264a27ca2d29b41a8981461648e9eaae13667e1d952aa50d716d88.webp)

Y220_0A014

![](images/26eda7ac36c8ea5085dd166197348e9439833973d68c79d1ab5eb5769c5b25ee.webp)


### FUEL SYSTEM
![](images/320f74516d08031dc777f9a8a93809967b893fdcb63c08796581a95a5c4c2a73.webp)

![](images/486448b3c3cf3d57f25dfeea6cce31992e1a6a022c176281271d057272bc6a72.webp)


### FUEL SUPPLY SYSTEM
![](images/ecd25201e8cda005101d5a88ac95a0d08498b5b0b3cbfc39272b5f966efd6e0a.webp)

Components:

- High pressure fuel pump - Fuel rails - Fuel pressure sensor - Fuel injectors - Electroc control unit (ECU) - Various sensors and actuators

Y220_0A016

According to input signals from various sensors, engine ECU calculates driver's demand (position of the accelerato jedal) and then controls overal operating performance of engine and vehicle on that time.

ECU receives signals from sensors via dataline and then performs effective engine air-fuel ratio controls based on those signals. Engine speed is measured by crankshaft speed (position) sensor and camshaftspeed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal thatis generated by variable resistance changes in accelerator pedal sensor. Air flow (hot flm) sensor detect intake air volume and sends the signals to ECU. Especially the engine ECU controls the air-fuel ratio by recognizing instant air volume changes from air flow sensor to decrease the emissions (EGR valve control. Furthermore, ECU uses signals from coolant temperature sensor and ai temperature sensor, booster pressure sensor and barometric sensor as compensation signal to respond to injection starting, pilot injection set values, various operations and variables.

![](images/00b2b2d59bcfa26eec1ab152b668a44ca8e214b241678bd9fa65ae75d0b70449.webp)


### VEHICLE SPECIFICATIONS
Vehicle Dimension

![](images/822574b4efff72fc7c9f3d76d5970958c4bdce8c8c0e302f497ab818dbb94a32.webp)

Y220_0A017

![](images/2ca9df73d0794aa4ec9f0a581d8a4656ca652865294a6b0c0d549b835a4be4ad.webp)


### Specifications
![](images/8ade26ce9edaa9df8cfec770ed319d7844925ea8cfee45b8b907b7c069098393.webp)

![](images/e910b43b685414ac181d05d593b01373409820a63ee8388e918e45de3f3da14f.webp)


### Specifications (Cont'd)
![](images/b1fe50a94c230b2943ba70774bc0c443aeffcd94f7791d12d8f2c1fb6c660b60.webp)

![](images/4f707c0b1236c729f57aba26fb97a6fe750f7fce37bc1bc18c78f003400eb208.webp)


### Major Components and Service Interval
\* Use only Ssangyong Genuine Parts.   
![](images/db99772592a9d924e0fe319fe982604960131ba4d630cb464a8e5eaa12c525f0.webp)

![](images/f299805caa108bff2fbe7c08bac4a814bcb77e6b4489c27ba355ba94d623e332.webp)


### Lubrication Chart
![](images/f65c9d49f614fc9be9befe3f76363cc159105f5ad0e5d2d4eeca483a42ec37fb.webp)
\*Please contact Ssangyong Dealer for approved alternative fluid. \* In only case not available MB 229.1 or 229.3, APl or ACEA oil may be accepted, however it would rather recommend to shorten the change interval around 30%.

IDI: Indirect Injection DI: Direct Injection

![](images/281c0e420fa46bb1e89bf08270df904ce2a8f656df965ca30de95d211558c21a.webp)


### 1. Vehicle identification Number
Vehicle identification number (VIN) is is on the right front axle upper frame.


### [KPTPOA19S1P 122357]
K.. Nation (K: Korea)   
P .. Maker Identification (P: Ssangyong Motor Company)   
т.. Vehicle Type (T: Passenger car - 4WD)   
P.. Line Models (P: Rexton)   
0 . Body Type (O: 5-door)   
A.. Trim Level (A: Standard, B: Deluxe, C: Super deluxe)   
1 .. Restraint System (0: No seatbelts, 1: 3-point seatbelts, 2: 2-point seatbelt)   
9 .. Engine Type (9: 3199cc, In-line 6 cylinders, Gasoline E32) (D: 2874cc, IIline 5 cylinders, Diesel)   
S.. Check Digit (S: All area except North America)   
1 .. Model Year (1: 2001, 2:2002, 3: 2003)   
P.. Plant Code (P: Pyungtaek plant)   
122357 (Production serial number)

![](images/0deeb74cc4e526964dbbf08cf7357b188132aace31548d9ac0635cff53f56242.webp)


### . Certification Label
The certification label is affixed on the bottom of driver's side B-pillar.

![](images/49ba8b3d1830777391d0d181793715ecb312e34c7bda0182ff764d6188c82713.webp)

![](images/d9f313c7fb905206d307cb800214005ab1d38052a88df7894a9281b4cdd0e5e8.webp)


### 3. Engine Serial Number
The engine serial number is stamped on the lower area of cylinder block in exhaust manifold side.

![](images/3f8efd5bac184c4af0ab1520f1664a033c8b00a92faa2e2110708110c6a79bbe.webp)


### 4. Manual Transmission Number
The transmission label is affixed on the upper area of clutch housing.


### 5. Automatic Transmission Number
The transmisson label is affixed on the right area of transmission housing.

![](images/f02d9136d994b6312acda689405ccbe7a38585eb7fb09dfa7807a32187d49397.webp)


### 6. Transfer Case Number
The transfer case label is affixed on the transfer case housing.

![](images/03c0cecf24b2b30be00e2ead4ae6dc17642ae479787493a2589c5c19dc075793.webp)

Y220_0A022

![](images/bd9c96bd3cccf5fde4ec3798476015bc843cd48766dae7e72d6671b716f324ed.webp)


### CONSISTS OF WORKSHOP MANUAL
1. Group: The manual is divided in large group like engine, transmission, axle and others and this group is also divided in small group by vehicle state. Small group: Each small group consists of general, vehicle service, unit repair and special tool usage.


### MANUAL DESCRIPTION
•The contents of the manual consist of operational principle of system, specifications, diagnosis, removal/ installation on vehicle, inspections, disassembly/ assembly of removed assembly, special tool usage. Not providing simple removal/installation information but focused on to describe much more functions, roles and principles of system. •Every automotive term like part name on the manual is the same in parts catalog, technical bulletin and drawings to avoid confusion among them.


### Consists of Smal Group
1. Contents: In small group, included subjects and detailed subjects are described in.

General: In the general, summary of the small group (assembly), function and operational principle, specifications, structure and components, diagnosis and circuit diagram are described in.

3. Vehicle service: Service works on the vehicle like replacement of parts and inspection repairs are described in the order of repair works with actual photos and illustrations. Also cautions in service works, references and inspection methods after completion of service are described in.

4. Disassembly and assembly of unit assembly: Detailed service works like disassembly, inspection, adjustment and assembly on removed component (assembly) are described in with systematic contents and photo illustration.

![](images/7973b1a42c37df7476dae19c90beab9d102f9f1e341744f7ed38e1743d7e54ad.webp)

![](images/c59a70997a951248bf376be0645168059eee669792dabda541758b8a21982aa3.webp)


### GUIDELINES FOR SERVICE WORK SAFETY
General

![](images/053a8f613ebd65f57a63630038ea3584cb1e5d86a89934df247398d48f50db5b.webp)

To maintain and operate the vehicle under optimum state by performing safe service works, the service works should be done by following correct methods and procedures.

Accordingly, the purpose of this manual is to prevent differences that can be caused by personal working method, skill, ways and service procedures and to allow prompt/ correct service works.


### Note, Notice
While using this manual, there are a lot of Note or Notice having below meaning.


### Notice
Notice means precautions on tool/device or part damages or personal injuries that can occur during service works.

However, above references and cautions cannot be inclusive measures, so should have habits of taking concerns and cautions based on common senses.


### Notice
During service works, be sure to observe below general items for your safety.

•For service works, be sure to disconnect battery   
negative (-) terminal if not starting and inspection.   
•While inspecting vehicle and replacing various consumable parts, be sure to take caution not to damage vehicle and injure people.   
•Engine and transmission may be hot enough to   
burn you. So inspect related locations when they cooled down enough.   
If engine is running, keep your clothing, tools, hair and hands away from moving parts.   
• Even when the ignition key is turned off and positioned to LOCK, electrical fan can be operated while working on near around electrical fan or radiator grille if air conditioner or coolant temperature rises.   
•Every oil can cause skin trouble. Immediately wash out with soap if contacted.   
•Painted surface of the body can be damaged if spilled over with oil or anti-freeze.   
Never go under vehicle if supported only with jack.   
•Never near the battery and fuel related system to flames that can cause fire like cigarette.   
•Never disconnect or connect battery terminal or other electrical equipment if ignition key is turned on.   
While connecting the battery terminals, be cautious of polarities (+, –) not to be confused.   
•There are high voltage and currency on the battery and vehicle wires. So there can be fire if shortcircuited.   
• Do not park while running the engine in an enclosed area like garage. There can be toxication with CO, so make sufficient ventilation.   
•The electrical fan works electrically. So the fan can be operated unexpectedly during working causing injuries if the ignition key is not in LOCK position. Be sure to check whether ignition key is in LOCK position before work.   
•Be careful not to touch hot components like catalytic converter, muffler and exhaust pipe when the engine is running or just stopped. They may burn you badly.

![](images/4f4f67754afb01855e5531dad8680d96d5f39164f3fb082b499388045b92c0c5.webp)


### Guidelines on Engine Service
To prevent personal injuries and vehicle damages that can be caused by mistakes during engine and unit inspection/ repair and to secure optimum engine performance and safety after service works, basic cautions and service work guidelines that can be easily forgotten during engine service works are described in.


### Cautions before service works
•Before work on engine and each electrical equipment, be sure to disconnect battery negative (-) terminal.   
Before service works, be sure to prepare the works by cleaning and aligning work areas.   
•Always position the ignition switch to OFF if not required. If not, there can be electrical equipment damages or personal injuries due to short-circuit or ground by mistake.   
•There should be no leak from fuel injection system (HP pump, fuel hose, high pressure pipe) of the D27DT engine. So they should be protected from foreign materials.   
•While removing the engine, do not position the jack and others under the oil pan or engine. To secure the safety, use only safety hook on the engine.


### Engine and accessories
Engine has a lot of precise portions so tightening torque should be correct during disassembly/assembly and removal/installation and service work should be done in clean ways during disassembly/assembly.

Maintaining working area clean and cautious service administration is essential element of service works while working on the engine and each section of the vehicle. So the mechanics should well aware of it.

• While removing the engine, related parts (bolts, gaskets, etc.) should be aligned as a group. •While disassembling/assembling internal components of the engine, well aware of disassembly/assembly section in this manual and clean each component with engine oil and then coat with oil before installation. • While removing engine, drain engine oil, coolant and fuel in fuel system to prevent leakage. •During service work of removal/installation, be sure to check each connected portions to engine not to make interference.


### Fuel and lubrication system
Painted surface of the body can be damaged or rubber products (hoes) can be corroded if engine oil and fuel are spilled over. If spilled over engine, foreign materials in air can be accumulated on the engine damaging fuel system.

If work on the fluid system such as fuel and oil, working area should be well ventilated and mechanic should not smoke.   
•Gasket or seal on the fuel/lubrication system should be replaced with new and bolts and nuts should be tightened as specified.   
• After removal/installation works, be sure to check whether there is leak on the connecting section.

If fine dust or foreign material enters into DI engine's fuel system, there can be serious damages between HP pump and injectors. So, be sure to cover removed fuel system components with cap and protect removed parts not to be contaminated with dirt. (Refer to cleanness in this manual while working on Dl engine fuel system)


### Electrical equipment
Electrical equipment should be handled more carefully. Currently, the engine is equipped with a lot of electrical equipments so there can be engine performance drops, incomplete combustion and other abnormals due to short and poor contact. Mechanics should well aware of vehicle's electrical equipment.

•If have to work on the electrical equipment, be sure to disconnect battery negative (-) terminal and position the ignition switch to offif not required. •When replacing electrical equipment, use the same genuine part and be sure to check whether ground or connecting portions are correctly connected during instalation. If ground or connecting portion is loosened, there can be vehicle fire or personal injury.

![](images/c0c93d6236dc928c584ff3c6c28f540cc4d29078e7ac9a0244ee309ed117bb08.webp)


### During Service Work - Inspection
Before lifting up the vehicle with lift, correctly support the lifting points and lift up. When using a jack, park the vehicle on the level ground and block front and rear wheels. Position the jack under the frame and lift up the vehicle and then support with chassis stand before service work.

![](images/9c74d1fa458f3ebf3177a76d7ec9dd95da1bfbc181ab210e75e4cd5e82447740.webp)

3. Before service work, be sure to disconnect battery negative (-) terminal to prevent damages by bad wire and short.

4. If service from interior of the vehicle, use protection cover to prevent damage and contamination of seat and floor. 5. Brake fluid and anti-freeze can damage painted surface of body. So carefully handle them during service work.

![](images/dc29644171ca11ce976e95e2d1ee3f48ad54033ad3234196f032d66a2d1f0d97.webp)

6. Use recommended and specified tools to increase efficiency of service work.   
7. Use only genuine spare parts.

![](images/771365c9c70034797ae661e2487d9928a46b4ed6a50ec2037af6e4e41049b937.webp)

Y220_0A028

![](images/3a2b9bedd1d4597d27cabbed0975c0fc6f6ddbeb218d7d2a47a02512848c7ed2.webp)

![](images/c8a5cc4ee88f4fc384dba721bf7d7744d6c0432c5398eb323d595addbdc384ae.webp)

8. Never reuse cotter pin, gasket, O-ring, oil seal, lock washer and self-locking nut. Replace them with new. If reused, normal functions cannot be maintained.   
9. Align the disassembled parts in clean according to disassembling order and group for easy assembling.   
10. According to installing positions, the bolts and nuts have different hardness and design. So be careful not to mix removed bolts and nuts each other and align them according installing positions.   
11. To inspect and assemble, clean the parts.   
12. Securely clean the parts that related with oil not to be affected by viscosity of oil.   
13. Coat oil or grease on the driving and sliding surfaces before installing parts.   
14. Use sealer or gasket to prevent leakage if necessary.   
15. Damaged or not, never reuse removed gasket. Replace with new and cautious on installing directions.   
16.Tighten every bolt and nut with specified torque.   
17. When service work is completed, check finally whether the work is performed properly or the problem is solved.   
18If work on the fuel line between priming pump and injector (including return line), be sure to cover the removed parts with cap and be careful not to expose the connecting passage and removed parts to external foreign materials or dust. (Refer to cleanness.)   
19 If remove high pressure fuel supply pipe between HP pump and fuel rail and high pressure fuel pipe between fuel rail and each injector, be sure to replace them with new.

![](images/5ebe55e083df91cf02ee7f33ead2e248aded3a68d32e11c0b7b9f836808d6db6.webp)


### Notice
Be careful not to modify or alter electrical system and electrical device. Or there can be vehicle fire or serious damage.

Be sure to disconnect battery negative (-) terminal during every service work. Before disconnecting battery negative (-) terminal, turn off ignition key.   
Replace with specified capacity of fuse if there is bad, blown or short circuited fuse. If use electrical wire or steel wire other than fuse, there can be damages on the various electrical systems. If replaced with over-capacity fuse, there can be damages on the related electrical device and fire.   
3. Every wire on the vehicle should be fastened securely not to be loosened with fixing clip.   
4. If wires go through edges, protect them with tape or other materials not to be damaged.

![](images/e9615aa52b5b40f14c5266bd410740c47bc41614bd1cd9afe483dd5a0b4bc253.webp)

5. Carefully install the wires not to be damaged during installation/removal of parts due to interference. 6Be careful not to throw or drop each sensor or relay. 7. Securely connect each connector until hear a “click" sound.

![](images/5144d65ef27101b2be7550fdae711e21a4d273b537900d1756b12937db2f5c96.webp)

![](images/f5208858258733f5d33e18e061ebc29e234931fd33b033daed27e989c3f7f67c.webp)


### 1. 4-post lift
Asilustrated, position the vehicle on the 4-post ift securely and block the front and rear of each tire not to move during working.


### Notice
During lifting, be sure to check whether vehicle is empty.

Board-on lift connection device installed in front of vehicle should be positioned in front of sillocating under the front door.   
Installift connecting device on the edge of front and rear of board-on lift.


> ⚠️ **Внимание:** Be sure to use attachment during lifting to prevent the lift from contacting with body floor. While lifting the vehicle, widen thelif floor as far as possible to stabilize between vehicle front and rear. When fixing the lif floor, be careful not to contact with brake tube and fuel lines.


### 2. Safety jack and safety stand
If lift up the vehicle with safety jack and stand, should be more careful during works.


> ⚠️ **Внимание:** •Never be under the vehicle if supported with only jack. If have to be under the vehicle, be sure to use safety block. •Use wheel block in front and rear of every wheel.
>
> ![](images/2b91e4505b5df3160281eb320c1437c92fe9063abc22a3665474f55a8a59cb28.webp)
>
> ![](images/9024c31f11373caf53d71d64d641a26040cdaba8bb994b10aacb57caf7b76553.webp)


### Tightening Torque By Bolt Specification
![](images/50926165c1562ed5da45e84adefb6872eaabf61ec0e23f03aab95a18005a73c2.webp)

![](images/46d94782d13e2291826cde4c0e47edf476f5a9caf6530e3db2136d4faa300931.webp)

Y220_0A034

1.Metric bolt strength is embossed on the head of each bolt. The strength of bolt can be classified as 4T, 7T, 8.8T, 10.9Т, 11T and 12.9T in general.

2. Observe standard tightening torque during bolt tightening works and can adjust torque to be proper within 15 % if necessary. Try not to over max. allowable tightening torque if not required to do so.

3. Determine extra proper tightening torque if tightens with washer or packing.

4. If tightens bolts on the below materials, be sure to determine the proper torque.

Aluminum alloy: Tighten to 80 % of above torque table. •Plastics: Tighten to 20 % of above torque table.

![](images/1fe01eec38bf3745993e48509bd8c8f866f96b157311c02c1e0d1ba9cc7c9791.webp)

![](images/8fbedc1d28eb0b7e2fa9490ee86663b8ef3fd18b2a76ade523c0646460b6ed7c.webp)


### STRUCTURE AND FUNCTION DESCRIPTIONS ... DI01-3
D27DT engine DI01-3   
Engine performance curve. DI01-8   
General diagnosis.. DI01-10


### DIAGNOSTIC INFORMATION AND PROCEDURE .. DI01-15
Oil leak diagnosis. DI01-15   
Compression pressure test DI01-16   
Cylinder pressure leakage test DI01-18   
Tightening torque. DI01-19


### DISASSEMBLY AND REASSEM.BLY  M01-32
Components and special tools . DI01-32

![](images/bac45d9211b50a2a2342651947ecc16a4839332e4a999df8c2b93a52978f08a9.webp)


### Major Components in Engine and Engine Compartment
The advanced electronically controlled D27DT engine that has high pressure fuel system has been introduced to this vehicle. It satisfies the strict emission regulation and provides improved output and maximum torque.

![](images/3f8087cb0aea0d7569d20701d0dd4e3048cd889e75a7e376272aa3c24ad587dd.webp)

Y220_01001

1. Coolant reservoir 6. Fuse box 11. EGR valve   
2. FFH device 7. Battery 12. Air cleaner assembly   
3. Brake fluid reservoir Fuel filter 13. Turbo charger   
4. Washer fluid reservoir 9. Power steering pump 14. Oil dipstick   
5. Common rail 10. Priming pump

![](images/1edd80dfd9a4760f0b73532d6aaca2280309d390d17ca992313d53bd7573ae15.webp)


### Engine Structure
![](images/4894ec5caa3c5becd9ae8520211d261c133fe33d0a91fde71f34546df2a24518.webp)

Y220_01002

1. TVD (Torsional Vibration Damper)   
2. Air conditioner compressor   
3. Power steering pump pulley   
4. Idle pulley   
5. Coolant pump pulley   
6. Alternator   
7. Viscos fan clutch   
8. Auto tensioner pulley   
9. Auto tensioner   
10. Poly-grooved belt   
11. Cam position sensor   
12. Drive plate (MT: DMF)   
13. Oil filter   
14. Vacuum pump   
15. Crank position sensor   
16. EGR valve   
17. Power steering pump   
18. EGR to center pipe   
19. Cylinder head cover   
20. Intake manifold   
21. Water outlet port   
22. Common rail   
23. Fuel pressure sensor   
24. Fuel pipe   
25. Injector   
26. Fuel return line   
27. Oil filler cap   
28. Glow plug   
29. Booster pressure sensor   
30. PCV valve and oil separator   
31. Oil dipstick   
32. EGR-LH pipe

![](images/2079acddc46adfbc8755906421377ad58fbe2fff7244f3954d63e1eb4225adca.webp)

![](images/7a534f62ddda8c5b3fb163ef308e1a83dbdf73c632d4f10172913b93724c1a94.webp)

![](images/795fb2564fab3e7034dc18ee6efcc1ac7623335ac16153f989380040ac947f2c.webp)

![](images/496e868ee39c31879f2b0c27abd1746a191fcb87b57efc108f0ce43f56df7fc1.webp)

Y220_01004

33. Cylinder head   
34. Cylinder block   
35. Oil pan   
36. Drain plug   
37. Turbo charger   
38. EGR-RH pipe   
39. PCV valve and oil separator   
40. Oil dipstick   
41. High pressure pump   
42. Turbo charger booster vacuum   
modulator   
43. EGR valve vacuum modulator   
44. EGR valve   
45. Exhaust manifold

![](images/79077323e4d5ae7b804e46024ab23fd7acb6ae17fa035db525de3222e9de030e.webp)


### Specifications
![](images/7eb41ba2e65b42b4ce77ed33d0d54db33b56eac32377ed466c6903ec0a84d771.webp)

![](images/9eb62504151e33fa71d1ac45426a26bcd6b0bfdc9f1e728f5e5c7b1bfd452d39.webp)


### ENGINE PERFORMANCE CURVE
Output and Torque

![](images/2f40723a8d37334724f08d4ddf71e6d7f77c0094738cdaf0b0960961adf6d857.webp)

Y220_00025

![](images/358688a60be5079f4f1b16fe71a6a412936336a7b3201d802741e98af76dd570.webp)


### Oil Temperature/Pressure and Boost Pressure
![](images/4ae221e7f454d08a4c44d7bc384b8518b0b3ca1ac6bbdcc2311de87d28383477.webp)

Y220_00026

![](images/bb3d7e58cc26593e3544f41531ee177013e041c82fa4c7ce8cfaa4c54eff66a8.webp)


### GENERAL DIAGNOSIS
![](images/591f6675e5a7003c656bea107a2841f143d7ead05a64e03ef136bc6308090bf4.webp)

![](images/8ac84400212d9b58e3c164a10dd3a025de150de72dc02f4f3ac9e4475a6309d6.webp)


### GENERAL DIAGNOSIS (Cont'd)
![](images/12eb1be7409ea21f5a25286ff589c59145f619c1ee9f6951b70ffc03b38a9519.webp)

![](images/a754f70fee7e35600a85ccf8b5ba71ae393de171a6423478a8a021eec1a1a2ff.webp)


### GENERAL DIAGNOSIS (Cont'd)
![](images/48c2bd6bdc5f4e36255f1884318ae5930c1dbc0a2e37c860a8e3a18ca83254de.webp)

![](images/b6f38378e0d569d3d437cd8a7f9820453cb19c620dfdb94911e705f3920e6f54.webp)


### GENERAL DIAGNOSIS (Cont'd)
![](images/e4f071d6f83db086421d4b360ab1a659bb56621111c12f051175562892987048.webp)

![](images/f80385c6b31a033ec538cdc1c59760bb16042a65de3128bd16dc936c2d1afdb5.webp)


### GENERAL DIAGNOSIS (Cont'd)
![](images/2cfcc45e64751f6591f745403a9adc991f5a0fce3a0e8f698666083e74a358ac.webp)

![](images/8b2a05e35af0c390759659e679f5cc83e06ab8d87edd539e2996d8282c8dc522.webp)


### OIL LEAK DIAGNOSIS
Most fluid oil leaks are easily located and repaired by visually finding the leak and replacing or repairing the necessary parts. On some occasions a fluid leak may be difficult to locate or repair. The following procedures may help you in locating and repairing most leaks.


### Finding the Leak
Identify the fluid. Determine whether it is engine oil, automatic transmission fluid, power steering fluid, etc.

Identify where the fluid is leaking from.

2.1 After running the vehicle at normal operating temperature, park the vehicle over a large sheet of paper.   
2.2 Wait a few minutes.   
2.3 You should be able to find the approximate location of the leak by the drippings on the paper.

3. Visually check around the suspected component. Check around all the gasket mating surfaces for leaks. A mirror is useful for finding leaks in areas that are hard to reach.

If the leak still cannot be found, it may be necessary to clean the suspected area with a degreaser, steam or spray solvent.

4.1 Clean the area well.   
4.2 Dry the area.   
4.3 Operate the vehicle for several miles at normal operating temperature and varying speeds.   
4.4 After operating the vehicle, visually check the suspected component.   
4.5 If you still cannot locate the leak, try using the powder or black light and dye method.


### Powder Method
1. Clean the suspected area.

Apply an aerosol-type powder (such as foot powder) to the suspected area.   
3. Operate the vehicle under normal operating conditoins.   
4. Visually inspect the suspected component. You should be able to trace the leak path over the white powder surface to the source.


### Black Light and Dye Method
A dye and light kit is available for finding leaks, Refer to the manufacturer's directions when using the kit.

1Pour the specified amount of dye into the engine oil fill tube.   
Operate the vehicle normal operating conditions as directed in the kit.   
.Direct the light toward the suspected area. The dyed fluid will appear as a yellow path leading to the source.


### Repairing the Leak
Once the origin of the leak has been pinpointed and traced back to its source, the cause of the leak must be determined in order for it to be repaired properly. If a gasket is replaced, but the sealing flange is bent, the new gasket will not repair the leak. The bent flange must be repaired also. Before attempting to repair a leak, check for the following conditions and correct them as they may cause a leak.


### Gaskets
•The fluid level/pressure is too high.   
•The crankcase ventilation system is malfunctioning.   
•The fasteners are tightened improperly or the threads are dirty or damaged.   
•The flanges or the sealing surface is warped.   
There are scratches, burrs or other damage to the sealing surface.   
•The gasket is damaged or worn.   
•There is cracking or porosity of the component.   
•An improper seal was used (where applicable).


### Seals
•The fluid level/pressure is too high.   
•The crankcase ventilation system is malfunctioning.   
•The seal bore is damaged (scratched, burred or nicked).   
•The seal is damaged or worn.   
•Improper installation is evident.   
•There are cracks in the components.   
•The shaft surface is scratched, nicked or damaged.   
•A loose or worn bearing is causing excess seal wear.

![](images/282202d6965c6497627f931e677c6eb0bdd3038816535ee76aca523b0c02b02c.webp)


### COMPRESSION PRESSURE TEST
The compression pressure test is to check the conditions of internal components (piston, piston ring, intake an exhaust vale, cylinder head gasket). This test provides current engine operating status.


### Notice
•Before cranking the engine, make sure that the test wiring, tools and persons are keeping away from moving components of engine (e.g., belt and cooling fan).   
•Park the vehicle on the level ground and apply the parking brake.   
•Do not allow anybody to be in front of the vehicle.

![](images/08978efa3bfd415320d9d223487ad0d8b6ea89d43e89239f8c7ab8bd5239eac8.webp)


### Specifications
![](images/f3992f2f137b09b0498599d25f6a0187a5da0df32a596b7d25df2b565333f13b.webp)

![](images/cb694116df634f64a5523c13405c57244d2f3f2da362cc891850fabf72a2e778.webp)


### Notice
•Disconnect the fuel rail pressure sensor connector to cut off the fuel injection.   
Discharge the combustion residues in the cylinders before testing the compression pressure.   
•Apply the parking brake before cranking the engine.   
1. Warm the engine up to normal operating temperature (80°C).   
2. Disconnect the fuel rail pressure sensor connector to cut off the fuel injection.   
3.Place the diagram sheet to compression pressure tester.

![](images/bfa142c7728cdc9b3c131a5222de71d820d8f19af3239c027d213a05da66cc96.webp)

4. Remove the glow plugs and install the compression pressure tester into the plug hole.

![](images/1099feaa539b7334e224de633ea9350108fb043a4b98a057fe5061a27d877bee.webp)

![](images/eab652a53e6550afd087ccb97706143acfad1bb90264de48edbffdec20f9de86.webp)

5.Crank the engine for approx. 10 seconds by using the start motor. 6. Record the test result and measure the compression pressure of other cylinders with same manner. 7. If the measured value is not within the specifications, perform the cylinder pressure leakage test.

![](images/8d028ce51c7db884de246356ffd16b9a6373dd54a8867d7e1208a5256a917c65.webp)

![](images/c6cc4c2c168650f1ac31410725a832e9c97ff6804cbe97c30b40bd0fca1fd5ea.webp)


### CYLINDER PRESSURE LEAKAGE TEST
![](images/40e0a74a53931e20939a51be72e8b4af30c3d5fdbe04af6d2f46f9ec62faba4e.webp)

If the measured value of the compression pressure test is not within the specifications, perform the cylinder pressure leakage test.


### Permissible Pressure Leakage
![](images/503e8a132c6ac3c1dcc907b8a3d89886ca6c4c8d73b4f338a6d94e9bb31a931d.webp)


### Notice
Perform the pressure in order: 1- 2- 3- 4 - 5   
Do not test the cylinder pressure leakage with wet type test procedure. (do not inject the engine oil into the combustion chamber)

![](images/c10aaa177d2a962cd42dbe786840cfeafbedb5ed0b41a4338cef710f201447cc.webp)


### TIGHTENING TORQUE
![](images/a52ea73aa034e4e168f99fd1c5c04624aa581d70836fcb98a46a24c0f7285e27.webp)

![](images/0cc6b6c74c8deecda95043ee07d3a0e9278a9bfaed1e553b269b9cc8cb0e0bf6.webp)

![](images/0e87440c61fb50594678a2c7ff73e86ef6fd45e5996f63ccc0f252d952027711.webp)

![](images/bfc8e130ae07285bc0271e52c200c8065e91cf18654f32c65c76827dc09b2c3e.webp)

![](images/ada4a8b816d89e911f0173aba248f1c08ca83d7f3eaed56fa49e3769b241199e.webp)

![](images/25d026f46f1f559d7e696958a1347fe8df3e1337490eead24bc778bcdea7db33.webp)


### ENGINE MOUNTING
![](images/dcedf1ff6a54c2b2de555cf473c8ae9ce42bfd79c63e04c03976abfb20bef147.webp)


### 1. Side Mountings
![](images/69fbe1ceb125307dbdc4a5c3e1d765e13bb5863d0cfbd661c7c8f694d7ebeff1.webp)

![](images/0f878e1a91eb2102923158ab99087ec463d6697d944c40791de354ea2ea70bd9.webp)


### Transmission Mounting
![](images/5b8fda64d1c1544397c203b8fe87d7ca33c3c814d54e14d6810a9162dd2e1506.webp)

![](images/a664aefe22086469646805bbddf923778ab92b96d963a21575620127c8637390.webp)

3. Exhaust Manifold and Pipe

![](images/e7baa12345fa9d2cf098d62a142b24b478a9830bdf314a60768cc21cf4aad7e8.webp)


### Notice
Disconnect the negative battery cable before removal.   
Drain the engine oil.   
Drain the engine coolant.   
Be careful not to splash the fuel to the vehicle body. It may cause a fire or vulcanization of rubber products. Make sure to block the fuel related hoses before removal.

![](images/4973ff3c13c6b4925314fd6505f3473d9aaf7c15535ca51d735d69b6ee01c753.webp)


### Notice
If not necessary, place the ignition switch at “OFF" position.

Remove the engine hood assembly.

![](images/7ba8981822426a8229f0770b3c568c441b740ef7470c614b4e9ce66745e41260.webp)

Note Refer to "Body" section.

3Remove the skid plate under the engine compartment. Installaiton Notice

![](images/c5ff9ed731a2a583c690583bdd7e3cf1ce1dfcc2f7ea34e20edf462561a0a9a9.webp)

![](images/218df5b03372da5b872c770e2a7989caa577543963e5ed4e2f344e9b2d29575f.webp)

4. Loosen the radiator drain cock and drain the coolant.


### Notice
1.Be careful not to contact with coolant. If contacted, wash with soap and water to ensure all coolant is removed.   
Use only designated coolant.   
3. Open the coolant reservoir cap to help the draining.

![](images/05b29092fd15b98091e3ee3f49b4f271fb053d381ddad4c3f55aa5a92a5353d6.webp)

![](images/f2bc871fefefdfee594d55718c41e899d9f96392dfb66460c298293fb2fe170b.webp)

![](images/53b2211666e2b686bc5957995616e80f3cd3d6342381f8ada66ed68731b445f7.webp)

![](images/544fe093d2810f3fcf92a2efcb55d8093b86f74777e5070b36c4a026f9dfd181.webp)

![](images/659c648f70f1ce638d0071df6c38151f1ae2a6a00ba91b4b4167873000fdebc3.webp)

5. Loosen the cylinder block drain plug (under the intake manifold) and drain the coolant completely.

6.Retighten the drain plug with the specified tightening torque.

![](images/68956a859dd7729b6f757b3f7c55e0c51ffb8eb11f79f3596f6db8eb12635286.webp)

7Remove the inlet hose (1) and the heater hose (2) under the radiator.


### Notice
Be careful not to damage the rubber hose.

Remove the coolant outlet hose over the radiator.


### Notice
Be careful not to damage the rubber hose.

Remove the radiator grille and loosen the hose clamp on the outlet port of turbo intercooler.


> ℹ️ **Примечание:** For the removal and installation of radiator grille, refer to “Cooling System” section.
>
> 10Loosen the hose clamp on intake air hose of turbo charger and remove the intake air hose.
>
> 11. Separate the outlet hose of oil separator from the intake air hose of turbo charger.   
> 12. Loosen the clamp on the intake air duct hose of turbo charger at the air cleaner side and separate the hose from the air cleaner housing.
>
> 13. Loosen the clamps and remove the intake air hose from the turbo charger.
>
> ![](images/6008a7524930324bd286649529de96960921ea4c3a60cf46c060305713b8b0c8.webp)
>
> 14. Loosen the clamp on the inlet hose of intercooler.
>
> ![](images/bf71918e814497af9c0759c6f0a2b3622a8b954eda9f6823c97a4010d081058d.webp)
>
> ![](images/899055a962dbab4ca21f2ff761626e889f99fd0d0d3e8e2bc618a1a6bcedde9e.webp)
>
> 15. Loosen the clamp on the intake manifold and remove the intake air hose.
>
> ![](images/ed5a88aba69182e020f511e295f1ddae49c01435d26f7de361be8fb14ba3500e.webp)
>
> 16.Remove the exhaust pipe mounting nuts from the turbo charger.
>
> Installation Notice
>
> ![](images/7bdd73b9f75a520ce775201b7f7552c685bec5363a8a7971a42fd03e763d0c0e.webp)
>
> ![](images/59852841ed9df636efa4389ed9f18b7eca8e7fd86a0820f6dc490127573b3b6f.webp)
>
> 17.Remove the power steering inlet pipe and the outlet hose from the power steering pump.


### Plug the openings of hoses and pump with caps not to flow out the oil.
Installation Notice

![](images/1d5eba297949ef9314c52b2d47980d4c3bf235d248b5b347efd70b49a1e07847.webp)

![](images/1c0ad61bc483e1e92bc249d53a6e840af2498ecb15cafe26d634726723d37687.webp)

![](images/a9be6cc60adb63e50420b0881eeb267564e2350fb147ec5b9c356a5d26e2ecd1.webp)

18Remove the vacuum hose from the brake booster. Installation Notice

![](images/8916b5d7272cfab4e31d6926a26390bd97c6892aa903b803fb7d097c02e6a0fc.webp)

19.Remove the supply inlet, supply outlet and return hose from the fuel filter.


### Notice
When separating the hoses from the fuel filter, plug the openings with caps so that the contaminants will not get into the fuel system. Mark on all the hoses not to be mixed each other.

20Remove the engine oil heater outlet hose.

21. Disconnect the cables from the cylinder block and other components. (e.g., coolant temperature sensor cable and oil temperature switch)

![](images/817971eb2f331d3eedfa4f421454e31d6e30c8e26dae0d0b4e377351a7ac6eda.webp)

22. Disconnect the engine ground cable and the alternator “+” terminal cable.


### Notice
Make sure to properly tighten the cable nuts when installing. Otherwise, it may cause a poor ground or electric charging problem.

23. Disconnect the “ST” terminal and “+” terminal cables from the starter motor.


### Notice
Make sure to properly tighten the cable nuts when installing. Otherwise, it may cause an engine starting problem.

![](images/db5bed06e92bd7c55d39ffa3eb41abeb9e6aae9a5b1c667832ccde04952ead6e.webp)

![](images/14dcf2025c69bc77c7445f69addb723d6cd6e625cc92c35a75e84869af60203c.webp)

24. Disconnect the air conditioner compressor connector and remove the inlet and outlet pipes from the compressor.

![](images/7facfe98e30447c280099dd0cf8e5867cb76b6a720ee376279ac12b677dced11.webp)

25.For the automatic transmission equipped vehicle, remove the oil cooler pipes.

![](images/bb6e469d442c2f1b72133b4bddb1525c4774c6cea368e55da900045dbf24c265.webp)


### Installation Notice
![](images/1419aaad25eb99cb71887a178cb9f517f5373b315ec6eab29299ffdc42a5b535.webp)

![](images/ba48609a997de11a63960f5cdd900bdd81c234f2d4c1a8cc4c07e3e23b292b99.webp)

![](images/7ac337e6a5e57feceaa15ab50fc17f959624c95a894dc4b66cff57270707a51e.webp)

26Set up the special to the cooling fan pulley and remove the cooling fan assembly. To make the removal easier, loosen the radiator shroud.


### Installation Notice
![](images/5676e53fbb141da61d774d199556c3c30f6b70db31fa8dee16981f0edcf2b47c.webp)

27. Remove the radiator shroud.


### Installation Notice
![](images/89782af2fa7fa0cfeec80376f44460e9269fd78a6e0ce0a89b6dee857ea592c4.webp)

Take of the fan belt from the engine.

1. Insert a tool into the belt tensioner and rotate it counterclockwise to take off the fan belt.   
After installation of the fan belt, pump the belt tensioner 3 to 4 times.


> ℹ️ **Примечание:** ![](images/dff901fd02f223eaafa8a2672cae06845f6252459781f00a4b85c23e1fd652a6.webp)
>
> ![](images/4a35625d01aaf6050eab8ef5fdc0b69d1e9a8ea96e0bdbfa607854720c3e2cc2.webp)
>
> 2.Remove the transmission mounting bolts and separate the engine assembly from the transmission assembly.
>
> ![](images/08d6c8117bec1205551717eb170724d40517ad2326e71e4e91c964e3e0ff3cf0.webp)
>
> Y220_01041


### Before unscrewing the transmission mounting bolts, remove the starter motor.
Installation Notice

![](images/6ba57655ea6d8a3452380bbbd30eeac1a3acc1dbeee2659726587b911ffe4188.webp)

![](images/3e7bdc87a555440c09f9022244057ae92e4b7306b223871fd6e7811dc8119165.webp)

30. Remove the engine assembly mounting nuts at both sides. Installation Notice

![](images/7c5e0e2fc686b7c800c8652a5303a30cd5544b2f6fe4b47e2557cfdf0332342f.webp)

![](images/b1690c6eb3fb13987e128be6febdd6c25bec44d98a3224d20b0688f4ab03fd67.webp)

32.Put the removed engine assembly on the safety stand.

31. Hook the chain on the engine brackets and carefully pull out the engine assembly from the vehicle by using a hoist or crane.

![](images/a696a694ff8e285b851c277dd767ccd0c69eca665e13643b129b6fb50b4f6468.webp)

Y220_01043

![](images/b4d547298b7777a01478bd2034f6a5f2975d8d584de5da4a189751d4a23d5586.webp)


### COMPONENTS AND SPECIAL TOOLS
![](images/90a91f4258969d835195cdcb5902bc74ee3607b361fe6e2b394e3faf538820aa.webp)

![](images/aba270335e72d65acc5d49d7dbfab1c5060ff2c296cd3b97c5646af9972642c4.webp)


### Preparations and Preceding Works
1. Remove the cylinder block drain plug and seal and completely drain the residual coolant from the cylinder block.

![](images/b1f0141a0dfd9041164d024e14146fb807b9aaddf2e57a2d886e5645282cce4f.webp)


### Notice
Replace the seal with new one once removed.

When the fan belt is installed, gently pump the belt shock absorber mounting bolt (M19) 3 times.

Take offthe fan belt while pushing the mounting bolt (M19).

4Loosen the oil drain plug and completely drain the engine oil.

![](images/342c2a8ea58a132f7d92ede31b2611a179f2fcc8c349a581e4779ebe5513ba5c.webp)

![](images/3c26e18b5520ba0d8fa4b2925d262caeac8d14cc4ec554f47edbc1de0c72a50f.webp)

![](images/b78ba17a67230bcf330095bef9a6c0a05804bb3b6d5d203a63f87f5647b6aa6c.webp)

![](images/9aa7058943ea8d0e2959d9bbdad0055ab6dc5862baab3eb003cd4e5ebfd05017.webp)


### Accessories - Removal and Installation
![](images/4b5758a77c29babfcbbad2041df8642621c9925a3a8c7b36f2cf924f1d9b0030.webp)

![](images/59b1072528b22ede89726abb1ea51ac5d04ca1918b06596cab0518304792dc57.webp)

The engine accessories can be removed without any specific order. In general, remove the components from top to bottom. However, be careful not to splash the lubricants to engine and body when disassembly. Especially, avoid getting into other components.


### Removal and Installation Order of Major Accessories
1. Vacuum Modulator

0

. Engine Cables and Connectors

0

3. Fuel Hoses

0

3-1. EGR Valve Assembly

↑

4. Oil Filter Assembly

↑

4-1. Belt Tensioning Assembly

0

5. Power Steering Pump Assembly

0

6. Air Conditioner Compressor Assembly

0

7. PCV Valve Assembly

\* Camshaft Position Sensor   
\* Crankshaft Position Sensor   
\* Injector Fuel Line Connector   
\* Glow Plug Connector   
\* Fuel Return Hose   
\* High/Low Pressure Hoses in HP Pump   
\* Ground Cables   
\* Fuel Pressure Sensor Connector   
\* Booster Pressure Sensor Connector   
\* Knock Sensor Connector   
\* Coolant Temperature Sensor Connector   
\* HP Pump: Fuel Temperature Sensor (Green) IMV (Brown)

V

Oil Dipstick Tube

Turbo Charger > Alternator Assembly

![](images/862107358fed8b99beaa84f20ebba866762f6b112110e4edd9ff672d5becd93b.webp)

![](images/11dc0f6eaba48ae70d981e83da5e16fa576c58786c61ed0f09537b5bd0e316f9.webp)

![](images/22298dcdbaab2fbba0091b06c9b3d56800fb8cc9f22012095f504bd307416cab.webp)

Y220_01051


### Installation Notice
![](images/32acbccfc2068ecbee5662c30a84ae41badaf5ecf1d78994d5088c6f5000e2c5.webp)

Remove the fuel pipes.

A.Remove the fuel supply pipes between each cylinder and common rail with a special tool.

![](images/5ab3c18f2240349bb1595c451555ead71cb9bf17aaf926f0677aec090a368c40.webp)


### Notice
1. Plug the openings of injector nozzle and common rail with sealing caps after removed the fuel pipes.

Replace the pipes with new ones. Be careful not to be mixed the fuel pipes because the pipe appearance of #1 and #3 cylinders and #2 and #4 are same each other.

![](images/e5a3a51abb3d8d40febd178f63238f40e9aa0423726515e292837b4931c8fef6.webp)

B.Remove the high fuel pressure pipe mounting bolts with a special tool.

- High fuel pressure supply pipe at common rail side


### Installation Notice
![](images/88c554e9fd66ab9b1b1a7aec00f769114fc0f928f4ec9896c3f3f4a1d94037a4.webp)

C. High fuel pressure supply pipe at HP pump side Installation Notice

![](images/e76be4c00fe78483acb112e57d083ababd0c4cb4876cdf7e34e6775a84cbfdde.webp)

![](images/71f43b255a6f1b8b9a1b9d48eb8a29fc471448ce250d291904d950db4ebc11e7.webp)

D. Unscrew the bracket mounting bolts and remove the high fuel pressure supply pipes.


> ℹ️ **Примечание:** Special tool: Fuel pipe remover and installer
>
> ![](images/ee1ef16d3923e19ad1b723a0a785b5f8b7cd214077a2d55635a66c1c36964a1a.webp)
>
> ![](images/41653716bc16adaf51cbc06dadde40f92ad6271a159ce3b8c3bec176b09cb010.webp)
>
> ![](images/c98f96aea8dbf53bf9ca1dd3ed7c36058227216292477464fff465c182d5bb85.webp)
>
> .Disconnect the vacuum hoses and module cables from the vacuum modulator.


### Notice
Put the installation marks on the modulator hoses and connectors.

![](images/2c4e1a933753ebbddcb725ad20d670356a018a3a0d1188dd8aefe87f0f96ef1d.webp)

Y220_01056

![](images/61c98e58b1344c0f3720b009dc7f834b58b957b565e2d0c12103dee886e62dfc.webp)

A.Remove the vacuum modulator bracket. (Upper: 10 M x 2, Lower: 10M x 2) Installation Notice

![](images/b1940194a206fd6ee176becb53c885cb44663ffea9e30de30e48b8cd1900841c.webp)

![](images/37c3569bd3981047fa90c6411ac9886e7d0ab242ece1bc13475e4b4e1128438c.webp)

3.Disconnect the wiring harnesses and connectors from the engine.

![](images/11d0a16711225f4a691f8deba02065e4f8f3f7778e939d19f9af13561cdd427d.webp)

![](images/5a7ee5430776eabccafd4b7321c989e1f51fe5eea0fb91a978ca8700a34f739b.webp)

![](images/e90bfe39c27c8fa7d88835e8b7a573bd7578c6f5fcd8e40f0a78a30936dbb560.webp)

![](images/9ff61dcc4433a4b0a19532aaa9a01e767e9d0c25b25857b146726ef42f1b5e2a.webp)

ARemove the cable assembly from the engine.


### Important
If possible, remove the cables after removing the fuel pipes. It make the operation easier and protect the cables and connectors.

Remove the cable screws and ground cable, and then remove the engine cable assembly.


### Notice
•Be careful not to damage the HP pump connecting pipe (venturi) while removing the fuel hose from the HP pump.

4.Disconnect the high and low fuel pressure hoses from the HP pump.


### Notice
•Be careful not to damage the hose connections. •Plug the openings in HP pump immediately after disconnecting the hoses.

Remove the EGR valve and EGR valve pipe.

A.Disconnect the vacuum hose from the EGR valve.   
B. Unscrew the EGR valve bolts and EGR #1 pipe connecting bolts and remove the EGR valve and steel gasket.


### Installation Notice
![](images/2af61283640c8cfa4022c1687fd8f9d3713251d4660da918cc2a8a2ed8595aaf.webp)

C.Remove the EGR valve #1 pipe.


### Installation Notice
![](images/a3b88fcca9da826a31e04712c0863dd390965779d49f6d86542d772504194833.webp)


### The EGR #2 pipe should be replaced with new one.
D.Unscrew the EGR valve #3 pipe (2) mounting bolts and remove the pipe from the exhaust manifold.


### Installation Notice
![](images/331bdd468fd9b2d263874b9855a65a8853dd895e99e1dc7abf2a280c3edcafd4.webp)


### Notice
1The EGR #3 pipe should be replaced with new one.   
2 Make sure that the convex surface of new steel gasket is facing to the bolts.

Remove the oil flter assembly.

A.Remove the oil cooler hose.

![](images/cd6aaea99764036e1f5c2abcaf66093d1be0f9b6649d2667670756633a2d6c5f.webp)

![](images/d51096d3660473755cd6b4f1f162aaa16c6ccad44067519ca5ed252db819aa21.webp)

Y220_01063

![](images/6e783137bcac80d254cf4225cfdda76907bcc8bf2209dfedb45fba12d488ceb0.webp)

![](images/6226e89bc844cf3841369a3455f197e8976a047f4a9d5587a17d1a4a22187f97.webp)

![](images/dcf1295d2839cb2c660de864ac71f5ffcb8a87ba669a8ca20b870b0e8c4c9773.webp)

![](images/84d5065c5fa75d1ab8c2456b39671d224a485ebcdf8d688e0840b9392b2fda3b.webp)

B. Remove the oil fiter assembly mounting bolts.


### Notice
Be careful not to flow out the residual oil from the engine. If flown out, immediately wipe it out.

C. Remove the oil filter assembly from the cylinder block.


### Installation Notice
-Replace the oil filter gasket with new one.

![](images/1ddbb711268e2e8b1ef586beb2120b61227b7e6d1ca11d11c04da25b7625a56d.webp)

7Remove the belt tensioning device.

A. Remove the shock absorber lower mounting bolt. Installation Notice

![](images/67150212a1439a9667c5b1eed8ea13413e64259b9247b00f42bb8583ae96e944.webp)

B. Remove the shock absorber upper mounting bolt. Installation Notice

![](images/0844a310cdeedaa38c9915c48a674b88c9814e6e2b2af3560e8775fb0d5a1876.webp)

C. Remove the belt tensioning device.


### Notice
•To prevent the oil leaks, store the removed shock absorber assembly with standing up. •For air bleeding, pump the shock absorber around 3 times after installation. • Be careful not to damage the rubber parts of the shock absorber when removing. •To prevent the oil leaks, remove the bolts from bottom to top section. On the contrary, when installing, tighten the bolts from top to bottom section.

7. Remove the power steering pump assembly.

A. Remove the power steering pump mounting bolts. Installation Notice

![](images/4c690cd3c496be82a2e7603339533f91c4bcf191fa799165260a063d58d9e781.webp)


### Notice
Be careful not to flow out the oil.

B. Remove the power steering pump assembly from the engine.


### Notice
To prevent the oil leaks, store the removed power steering pump assembly with standing up.

Remove the air conditioner compressor assembly.

A. Unscrew the bolts and remove the air conditioner compressor assembly.


### Installation Notice
![](images/dce3be77214e61b2957ed1274bbc90b96cdde7c346e4aad34b359d0f8d7a8437.webp)

![](images/44d35c59bb8844479dce0815b7ce26f16fc8d2c57899884d6b026e7563565e89.webp)

![](images/ced5251c691a786388f7cf1c2f9e883a58eb79ca92b29a0604cca0b11a50aad8.webp)

![](images/d7c9782f34f2c6b67126a0fa49c62719786cf8903f64325fe4e43647e91c1dc1.webp)

![](images/3706116a0193e81495ef133a50135bf8ead187f4c7e38c1e1cee633f82b89baa.webp)

![](images/cc0cae823a5a5ed30ac911df9ddcae0c19fe742367faba396ce9b5b6ec42337e.webp)

![](images/d4fb0917f2d444ef60e0786fc081372160142ea14462458157d1c889a1eb2528.webp)

![](images/0eaa0735b47e1b35f3944d0f657afe89f6dd8b879d07cca8656eebd595514d49.webp)

B.Unscrew the bolts and remove the air conditioner mounting bracket.


### Installation Notice
![](images/f8578642d5f26d4760db6470546e4e3833ec0d0ddf11891837df37f4ef4dc1e6.webp)

Remove the PCV valve assembly.

A. Remove the PCV valve hose.

B. Remove the PCV valve hose connected to the engine oil hose.

C. Unscrew the PCV valve mounting bolts and remove the PCV valve assembly.


### Installation Notice
![](images/bb3c52b529f8f543a940e2851498185c8d98d2fd1b212b3e589b8fa95be32afd.webp)

10 Remove the oil dipstick tube assembly.

Unscrew the bracket bolts and remove the dipstick tube with O-ring.


### Installation Notice
Insert new O-ring into the oil dipstick tube before installation.

![](images/cd301d808a654b27a5f686cc35e410a48bbd92847afac5a3510eebfcf58ffcd1.webp)


### Installation Notice
![](images/01129a4d2f9cce3acfc639d11894fc494c89f643cc5ca3bc95bdd4b923acbb30.webp)

![](images/bb543079b75e5747e19e4cb855d2c8054303a8469508358c5851e3f507a6895d.webp)

1Remove the turbo charger assembly.

A. Unscrew the bolts and remove the oil supply pipe.


### Installation Notice
![](images/0d63ed1a4b56dfc8c318de9f576c7296e2842b5ccc805ce9af1e87e687e49178.webp)

B. Unscrew the bolts and remove the oil return pipe.


### Installation Notice
![](images/32eaee2ef649168ae1904e6e71fcf686fe92248d83aa38c99fd756f3efa541e5.webp)

Make sure to install the gasket with correct direction.

![](images/1446928e8cc008ed86e79761c2eec47fa9641d68723dd09995e2638ccaf2cafe.webp)

![](images/040c73fb678041995c7a7ac740263f476da510cfcc5ea38923fceb6232cbf34a.webp)

![](images/69cd1ca4e45179dca4ddba2d6a0ca08eb9fe623501afe6d649dcb4debbc058e6.webp)![](images/a71a0990bd59f50eb0dd7c36c4795ba8ac2aab256542717c1fc925e17779442d.webp)

![](images/735b30d32f76c1f75800f51df092760e0bb9c76707859fe357f7020c5f0d299a.webp)

C. Unscrew the turbo charger mounting bracket bolts. Installation Notice

![](images/59b591372968c9cf0904ac37ddbd26d5f9b33f7055ccab3aeda9c2c0878b22eb.webp)

D. Unscrew the turbo charger mounting bolts to exhaust manifold.


### Use only 12 1/2 wrench.
Installation Notice

![](images/ad9bf8fa246dc20ebec68f8b9004f7a872139a4c2727f41b5b6840c596dcc672.webp)

E. Remove the turbo charger assembly.

1Remove the alternator assembly.

A. Unscrew the bolts and remove the alternator.

Note Alternator Capacity: 140 A


### Installation Notice
![](images/ed4f5a507365b30860182c0def2e54cb2c612ed4360e8f2ca5fcc2a1ba314ac9.webp)


### Installation Notice
![](images/2930909e8fec0664f9d9d974a8a83ddc5d848c19cefc5d9b4154fdcc5764dd2c.webp)

![](images/f5dd97fc4eeecda93dba5f949297cbb7a192d0fc2133c048a08bcd5ac603a3c7.webp)

![](images/e7ace6836d7db34467f74faa99da82abc83eba768eb1b37c01fd4ddac8ec1b51.webp)


### Engine - Disassembly and Reassembly
![](images/9186803d5263ef316b3a9d16b5d6ebcb37d3869c410eb55dbb367130cc04b85e.webp)

![](images/3fc54e3f147c5a52a452f42837826164051280cf7db005512eba8b86cb8db5f5.webp)

1Unscrew the injector nozzle holder bolts (12-sided) and remove the injector bracket.

Installation Notice

![](images/a6887dbad420ce7b05e9c0230700d1019d9e0d5a9a5c71473cdb5f4373a5d6f3.webp)

Remove the injectors with a injector extractor (special tool).


### Notice
•Be careful not to take off the sealing caps on the injectors and fuel system.   
•Replace the copper washers with new ones when installing.

3. If the copper washer is in injector hole, remove it with a special tool as shown in the figure.

![](images/7716e61a56ed1a735aba18239bd97ea8c2df95f3fa56ab5fc0d22d09d1450169.webp)

4Remove the glow plugs with a special tool. Installation Notice

![](images/58ac548fb964bfcd90f49fd5fd8fcb18c79f101ca860c3401e953b15ff570b30.webp)

![](images/2f636903dc3e6d92b3dfd645da2029e5e271955873cb4cffc307d6576cecb36c.webp)

5Unscrew the Torx bolts and remove the common rail from the engine.


### Installation Notice
![](images/efc27d28bb8838a038c3a1e4a411de008cf8378691684228d53b0aa4f4f2ac8f.webp)


### Notice
Plug the openings with sealing cap.

![](images/a96e40f1003baa2577c9a9d489e3619c4035016a2db1bc5c525db4b2303e27da.webp)

6Remove the booster sensor from the engine. Installation Notice

![](images/579aa548de07bb22a273f152fcc15d1635141582a27fa89517b1c566d101745b.webp)

7. Unscrew the bolt and remove the camshaft position sensor.


### Installation Notice
![](images/deb55d120fde4869f69dd1c6587e1876b764a307a80eebd88befc208cfa1f793.webp)

Apply Loctite on the thread before installation.

![](images/4115f41887bd235a9baa762d02c3c93e652ae2e6202c4017c5d57306cb8cb885.webp)

![](images/58ddd61f5413394c1f61ae696bc61da49887a55423079805d3d75a45975b56d8.webp)

![](images/7c00fc6a55e4acb367d606756dcc10c6f0afdb93730f25d5e8e35a91a30e478a.webp)

![](images/843ef3729ec876e1eebfce4285138d5c7b4666846ed23f70c1549d9fb1fe4aee.webp)

Unscrew the bolts and remove the cooling fan pulley while holding it with a special tool.

.Remove the cooling fan belt idle pulley while holding it with a special tool.

![](images/006786c843ddad1f2c75545cecc7db418551a6e555dbd11631f8288e60ff76e5.webp)

10. Unscrew the bolts and remove the cooling fan bracket assembly (timing chain cover).

![](images/7ed9b48f10c84764478581d61842c53f7619f746cf04a33ab6e4674752b84368.webp)

![](images/ae095c80f72bfc8cc15f52bcf3132ef78a064e511bc8bc75e1faf14134e6c3e3.webp)

![](images/df3655dd320c493f2da713e595f5b8b54f23c4b5d99af19d66aa5e1f55d81f05.webp)

11. Unscrew the bolts and remove the cylinder head cover.

![](images/4850513135324d74558d31c334cd846aa2de61664b487c0d2d94aee690b7e694.webp)

12 Turn over the engine and remove the oil pan.

Installation Notice

![](images/ca5c4b444ab1a395ed5b2ff66936f11577cb06e6d16147cd06b435ed0fb67b33.webp)

![](images/98daea2dc57b2e840fa8cd3087e67e4d787b5bc95ec83492656889328bc42915.webp)

Installation Notice

Remove the oil seal residues from the oil pan and apply the liquid gasket on the parting surface.

![](images/f39549e3350e7966af0463020c142cd49ed28e5843bab1117f980d4303ce08ef.webp)

13. Unscrew the nuts and remove the exhaust manifold. Installation Notice

![](images/75843f560888d83be3cb44e1a6e18e1ebc2c9fecdc12287e1c76fc96a07f5d8c.webp)

![](images/c40407cedf201b5d883b920ec1fa7a9befc575f992f3fb28e30555aac7efd5c7.webp)


### Notice
The exhaust manifold gasket is removed along with the exhaust manifold. Mark the installation direction to prevent wrong installation. Otherwise, it may cause a sealing trouble.

![](images/b45c7c8d62546cf5482bedb3eb2b4597bafe38224010ade2562da6836800f458.webp)

![](images/0d84ee8ccecbdc25f1d9f59dfc5bc2bd7c82f2554283ba97d4d670ffdff37a5e.webp)

![](images/6b2a531866c91db2dc068e2d2f1f2295babcea985734ea5c0e98f693286d2800.webp)

14. Unscrew the bolts and remove the thermostat. Installation Notice

![](images/bb05121e2be6d77056f7fa7aaa833d86565d05a3eb72083648f86beeda4d67e0.webp)


### Notice
Be careful not to flow out the residual coolant.

15Unscrew the bolts and remove the water pump. Installation Notice

![](images/9e3a08f99a74dec4d39197c11100d3846723fd0817ec3fe57f0f4d1a041d1394.webp)

1Unscrew the bolts and remove the water pump housing. Installation Notice

![](images/fde0888f9996409469a8953bfa47d4991335c9fcd29b010e26f32830c33d1f79.webp)


### Notice
Be careful not to flow out the residual coolant.

17. Unscrew the bolts and remove the coolant inlet port from the intake manifold.

Installation Notice

![](images/5c106486c2b8f882be62f7abaa9b0f3f40a7c9ac151974342d0dd89c4206b08d.webp)


### Notice
Be careful not to get the coolant into the intake manifold and engine.

18. Unscrew the bolts and remove the intake manifold assembly.

Installation Notice

![](images/5364dba147684d19b8b26b996bc51e693fcc8409e65088619b11865df3cf348f.webp)

![](images/da0da4b15b86876253b4dc1ce607b9ec47117022d02d128fb366d330f6b77b78.webp)


### Notice
Replace the gasket with new one once removed.

![](images/13e1f0fe8ff11a512293e902479d84693185ac9922eee13762a96d108d3ddb10.webp)

19Remove the vacuum pump from the cylinder head. Installation Notice

![](images/fc7a7da4849bb2c51a52a7a06f505b8df9cb53bfe87892a13ff982976b51f704.webp)

![](images/ad5d42582ec42e255d2d89a043ce92369d22c7a20aeafc857f95966397def81d.webp)

20. Install the engine lock (special tool) onto the flywheel ring gear so that the engine will not rotate.

![](images/b34417341df72e6ff20fc3527b25d27af8b657e9c5f810cb9b3431e7f372f02e.webp)

![](images/b55e0b6ddea1dca2ed5a2e038a2ac97269489ed9bf7074d783100afd9c6830c5.webp)

![](images/205852d2db5ebff2fe942927aba906cfcbc8a818d28899a265e240f7aba52141.webp)

![](images/8932c40c1961ec4a6624046981eaa134ff6d5843052ce59d3b3090685a24d20e.webp)

21. Remove the chain tensioner.

![](images/5ada90eb491ca443f5a97c5d0d1b20e2caeaa75cf62d99a2e6cdfe24a07b1a0f.webp)

Preceding works: removal of EGR pipe and oil dipstick tube

![](images/597b402829707e16b0b3a6d9b6f36893833be62e16fe14b95c6a9c1b03cff32b.webp)

22. Pull out the lock pin and remove the upper chain guide bracket.

23. Unscrew the bolt and remove the intake camshaft sprocket.

Installation Notice

![](images/f7a0666d080f70331c93f9a6c0c53e5c664cdba20d52ff71cabfc7fc3de09f6d.webp)

24. Unscrew the bolt and remove the exhaust camshaft sprocket.

Installation Notice

![](images/0b8f713e829171f163d2903c8788685b87e33ff0c359f1d390ced2b5f239ab44.webp)

25. Remove the camshaft bearing cap bolts so that the tightening force can be relieved evenly.

•Intake: #1, #3, #6   
• Exhaust: #7, #9, #12

\* However, there is no specific removal sequence.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11

\* Do not remove the bolts at a time completely. Remove them step by step evenly or camshaft can be seriously damaged.


### Installation Notice
![](images/8b9abd67db81a5a801500b65ff9595d0ee5569e11935489cf20abb4f24d7d7d5.webp)

![](images/97b2ed48e17a956095b0d68ada57d948b6b4aa87055660ecb252a86f38b6a1e3.webp)

26. Remove the intake and exhaust camshafts from the cylinder head.

![](images/6340eedbf214c00073027fbdddffea9bf0b23cf434cfbb56f5bb94bdd2d91d05.webp)

27.Remove the finger follower and the HLA device.


### Notice
•Avoid contact with hot metal parts when removing the HLA device immediately after stopping the engine.   
•Be careful not to be contaminated by foreign materials.   
•To prevent the oil leaks, store the removed finger foliower and HLA device with standing up.   
• If the HLA can be easily pressed in by hand, it indicates the oil inside of HLA has been flown out. In this case, replace it with new one.

![](images/595ec0ffba731ab6c418e8f61db9b33c3caf23e85e63fe235083f6985482d4ae.webp)

![](images/6165eac5cb9ef035d2c3568787ba7f31f5e64e7f57687fe7b034b2233d9eefe1.webp)

![](images/db4047a2e97e3892b1d953e9d195d59fa2a99cc739c421720e82cbe7eecc3a03.webp)

28.Pull out the pin and remove the timing chain guide from the engine.

![](images/8d9ebfcd9118cdf3c1f40a5fab34c95a07675c56c124d79abefc32fba306e34f.webp)

29. Remove the cylinder head bolts according to the numerical sequence.

Installation Notice   
![](images/81cb5ffdcfe7a26dcea7b864dc33530a06501ad8f346ac40396e58e974f33ae7.webp)

![](images/d6e52af3db124767e9c23263a908bfef056be318aa10831f15a6075e2961bda1.webp)

30.Measure the length of cylinder head bolts.

If the maximum length is exceeded by 2 mm, replace the cylinder head bolt.

![](images/9f58395b6fedeb8138e089ad44fda078d916b09d7dae16609982d00e25b706d1.webp)

![](images/439db9b9e10ad68a206656b201f3b0f9e09c717c1a8061fd6467e9679f9bfd88.webp)

![](images/5a00e6a9728abf4d3771335c3a07191ed46bfd2aaea43aabe0b3caf36844d2b3.webp)

3Remove the cylinder head.


### Notice
•Inspect the cylinder head surface. •Store the removed injectors and glow plugs so that they will not be damaged.

3Measure the piston protrusion from the parting surface. • Specified Value: 0.765 \~ 1.055 mm

![](images/841873b2482c58190f4c1a16ce606aee500b53a717a84a666218941540d44291.webp)

33 Remove the cylinder head gasket.

Installation Notice

• Replace the cylinder head gasket with new one. Make sure to place the “TOP” mark upward. 1. Put the steel gasket on the cylinder block and position the cylinder head.

![](images/53877e2d68c3348e0bbf2b232151f2e1f5e25588e6afa19135718708edd653b3.webp)

Tighten the cylinder head bolts to specified torque and torque angle.

![](images/657e109a3a4ea3981db376fbe509f761426290cb710237e8b0d144cb44e8e920.webp)

•Apply the oil on the bolt thread when installing. •Always insert new washer first. •The bolts (12) at vacuum pump side are shorter than others.

![](images/c5fe2e9ea1382b86de54bd63b7489de428900f03f23a8f29b0ff2ed87f9c4fc7.webp)

34.Turn over the engine and remove the bafle plate. Installation Notice

![](images/2cf8afd1623f8e92b9b40001a655325b7b9beb1803391a9a21767936053eb0d5.webp)

![](images/1ed153cea7ed607865b56d2cd60b5e7260ec6fd5fd556ec587ea8371031296f5.webp)

![](images/581d1820bad9e57dadb013d54dc95a7d6f14516b26cbb9bf8ee9fac6d3311ea6.webp)

![](images/2a60386566b9c0ad3214ccf0a90d748719b00c6005df55a2a568640483981e21.webp)

![](images/3124a5f4fa6ffa174c8da55c950f1b16aa670349222ceb17a1e5d48ae16e4af8.webp)

![](images/88b0bf680193eda40c90740e719682549a7ffca3fe4219be65fc8f3cc2e16d40.webp)

35 Unscrew the bolts and remove the oil strainer assembly. Installation Notice

![](images/54448d7f26d8eb662efb6b5f5bf67b8131010419752c218dfb96ee2ccdb4e65c.webp)

3Remove the piston assembly from the cylinder block.

A. Unscrew the bearing cap bolts. Installation Notice

![](images/3e748fe59af258bf065c31ecda16a62e6c749596f035d27c11fbb83d48a14a2b.webp)

\* Tighten the bolts from #1 cap.


### Installation Notice
\* Align the oil grooves in bearing cap and connecting rod.

B. Remove the bearing caps and lower bearing shells.

C. Remove the piston assembly through the cylinder.


### Notice
Do not mix up upper and lower crankshaft bearing shells.

D. Remove the snap ring piston pin from the piston.   
E. Disassemble the piston and connecting rod.   
F. Remove the piston rings from the piston.


### Installation Notice
Replace the piston ring, bearing and snap ring with new ones.

37. Lock the flywheel and remove the center bolt and crankshaft pulley.


### Installation Notice
![](images/6b0b955976a7da0b4df3db88ccea55b382b1ffd63c54bd77b081a513e515faee.webp)

38. Remove the timing chain cover assembly.

A. Remove the cover bolts. Installation Notice

![](images/662f46f5d8864329b2edce8e12ff2c7f1aa7e0643d15c74137497349d258e64f.webp)

![](images/4d6e45049fad9c7b5f7f43ca08581b5b78cdb9dcd29d5909d425c4068fe17dfb.webp)

B. Hold the timing chain and remove the timing chain cover by tapping it with a rubber hammer and a screwdriver.

Installation Notice Apply the sealant on the parting surface.

![](images/a524aed842c7783ae412f6774cd794245dc7c0e1ea7010f2161090fd4e741dc1.webp)

![](images/23fa51ff11c87a9008b1c26a57e11c80ee76ffb6978f80dc6894560734cbcf17.webp)![](images/45bb4ae4e95cd311777345f803757e3d7b2b03787ef7579cee6cc118737bc7bf.webp)

![](images/3662e180b58c52a713982340bd29c00f22baa3c963f18499468a3dc9c03fa3fa.webp)

39.Remove the timing chain guide rail and timing chain.

40. Remove the HP pump bolts and the HP pump bracket bolts.

•Remove the HP pump assembly.

41.Remove the crankshaft sprocket with a special tool.

42.Remove the flywheel and the crankshaft strainer. Installation Notice

![](images/96a9d870040c09dae6857b48e7b6fdd89168945972524e6f6fdcf5a24bffb8ea.webp)

43. Unscrew the bolts and remove the crankshaft bearing caps.

Installation Notice

![](images/6f44af8a2cafc14621cc5f1ecdaf09976cbf2cf78865e382e5f21817554562a1.webp)

![](images/5bf68ad8c78311c749150705952d83ebdc31008554b0f2c91e0518b64784fa68.webp)


### Notice
•Remove the bearing cap bolts from inside to outside with a pair.   
• Do not mix up the crankshaft bearing caps and shells.

![](images/b6d5d8db1fe559643d723ab2fc2469e531a9886c9a7ca06bac48483bbfa1be05.webp)


> ℹ️ **Примечание:** •Install in the reverse order of removal.
> •Tighten the fasteners with the specified tightening torques.   
> •Replace the gaskets and bearings with new ones.   
> •Make sure to install the gaskets in correct direction.
>
> ![](images/c9369ceb0e4d5d6880e83a30b86e88a36c323341e78e50399479f8a11564f465.webp)
>
> ![](images/05cb996da159849db4d7874516e21bb107183411fb7892bb41f0f5f2c48dedd8.webp)


### CYLINDE HEA/.YLIN DE BLOCK . MI2-3
Cylinder head. DI02-3   
Camshaft assembly DI02-17   
Timing chain assembly. DI02-25   
Cylinder block DI02-29


### CRANKSHAFT. ... I02-332
Arrangement of thrust washers and bearings .... DI02-33   
Torsional vibration damper .… DI02-38


### FLYWHEEL .. ... DI02-42
Dual mass flywheel (DMF, Manual transmission equipped vehicle) .DI02-42


### PISTON AND CONNECTING. ROD . . 4
Piston ring... DI02-45   
Cylinder inner diameter and piston size .DI02-46


### HIGH PRESSURE PUMP (HP) ... . 251
Components locator DI02-51

![](images/da2b3f03d4c97c4b12cf1b0ce52f4c814e614c91742c6d35e6c52c625a4aa6fd.webp)


### CYLINDER HEAD
![](images/48be20f647573c0aceec472d0d0cb3b272dd18bd1079c7b01285d4e0f4db7b11.webp)

![](images/6e898f3045ac1fa6f174a37c3f389fc9beb7e63e80c4d504a50b6e5fcbd3689a.webp)

Y220_02001


### System Characteristics
•4-valve DOHC valve mechanism   
• Swirl and tangential port   
4-bolt type cylinder head bolt   
• Water jacket integrated casting   
• Integrated chain housing and cylinder head   
• Oil gallery: drilled and sealing with cap and screw plug

![](images/9a6bf53ed57d0893c25a24d6486947bdc2b9cff6d79fe9513302a929a3a974a0.webp)

![](images/a29969d9ca0838d720c3c3b22c307faa7839f4f0ef1910d9df6f6dd5ade0e24e.webp)


### Cylinder Head Pressure Leakage Test
Preceding Works:

-Removal of cylinders   
- Removal of intake and exhaust manifold   
-Removal of valves

![](images/0d7acbf608c90d9c7812284ef1063086d09f51913400e7a91c7fe881a6919d88.webp)


### Test Procedures
1. Place the pressure plate on a flat-bed work bench.

Install the cylinder head on the pressure plate.

![](images/be28ade39df5977d59643d0223963d8ceab8876a23c6367322d81cba38e936b5.webp)

3. Immerse the cylinder head with the pressure plate into warm water (approx. 60°C) and pressurize with compressed air to 2 bar.


### Notice
Examine the cylinder head for air bubbling. If the air bubbles are seen, replace the cylinder head.

![](images/e85719d6f37b25c41c5f3d7b8352d1e66ee438b2c7877480e1a4ec23b9da9a3b.webp)


### Specifications
![](images/0037361c12967a25071d8c16fc28ad3672cd1a567bfa5a78b69dee06ce720fc9.webp)


### Measurement
Measure the cylinder head height “A".

![](images/504900d33f953d57a5623d63641598e0ed541e5d23d7dd4cda9f668baa259551.webp)


### Notice
If the height is less than the limit, the cylinder head must be replaced.

![](images/baaa592d920de9046bd2cb5cc5344087d020c5e8d1a9ad7049586a9d022178ae.webp)

2. Insert the valves into the valve guides and measure the recesses.

![](images/d36f76f0312deaca289fb7d862b968a60e14e7373a52c77fa675e8d0bea68ef8.webp)


### Notice
If the measured value is out of the specified range, machine the valve seat as much as necessary until the specified value is achieved.

![](images/1a2e8b5809fbb054564acf4b186a30dbde03337a821b8007d9444a70fd07f730.webp)

![](images/82fd8add917780ded8dc560ca31e65a1f451dd359fbaec9cf43fbf9e480591b9.webp)

![](images/3461391fdbc8af77c28388507068dfa99ff80d8ba4e858ec21279a1c1f969791.webp)

![](images/9bf1ef89cbdc532889054ef3bacc685935a8149ed5ce3598c9ebfcbbd71e21a8.webp)

![](images/ae8e1446a2cf6e457c108867ad9fc7c59b749d58e63ebf48f8b5a575b73be726.webp)

![](images/8227828582e673ead5ce87a059a7427e1c7e704b611e04fee4c80ce831666830.webp)


### Disassembly
Preceding Works:

- Removal of fan belt   
- Removal of fuel supply and return lines   
- Removal of EGR related pipes   
- Removal of intake manifold mounting bracket   
- Removal of injector fueline and connector, and glow plug connector


### Notice
• Plug the openings of injector holes and common rail with the protective caps.

1.Remove the cylinder head cover.

Remove the camshaft position sensor.

The intake manifold can be interfered by the sensor when installing.

3. Mark on the intake camshaft sprocket and exhaust camshaft sprocket for timing setting during installation.

4.Remove the chain tensioner. Preceding work: removal of EGR pipe and oil dipstick tube

5. Hold the camshafts and remove the intake camshaft sprocket and exhaust camshaft sprocket.

![](images/216b43c941b627d52ff3045c627d21da0036544de3f2fc45ea00886ab2c064bc.webp)

6Pull out the lock pins with a sliding hammer and remove the upper guide rail.

Correctly align the electronic control module onto the shift plate by using two central pins when installing.


### Notice
7. Remove the oil cooler, then remove the intake manifold.

The intake manifold can be interfered by the cylinder head bolt (M8 x 50).

![](images/96dcb12e31322c21bd2a8e5429a9a0a5ec813560fd8803233c3b1f325ac1c95e.webp)

![](images/41939f0a098a694852574b4e7eca5b4340a67bef1faaf7eb12a77ace7d0c7aff.webp)

![](images/c380b75d179ebae75276868f26c6cba6e0ecd8a82361608c53dd95d2579e7f98.webp)

8. Remove the cylinder head bolts according to the numerical sequence.

M8 x 25 :2EA   
M8 × 50 : 2 EA   
M12 x 177 : 11 EA   
M12×158 : 1EA (Vacuum pump side)

![](images/8e6756d9fc249580ea906f1e11ae399038961a817abe0702fa414af821714b78.webp)

Measure the length of cylinder head bolts.

If the maximum length is exceeded by 2 mm, replace the cylinder head bolt.

![](images/06057cc4254b759dcb4a8eed62533d306b5d0d9882b1308ec36def47a80108cf.webp)

![](images/8fec1ad01fb075b8aa94ccd0fae0f69a20ee9822d1f700d65568f9abaefa3c31.webp)

1Remove the cylinder head.


### Notice
•Inspect the cylinder head surface. •Store the removed injectors and glow plugs so that they will not be damaged.

![](images/b8caca376e8a72df5cd26f870e5706ba1be05755cff1d5c3801d153b4af5dc39.webp)

![](images/c8e0ebc1fadc6a97bef60e6b502d17e7265fd318a3ad373fbf466d1a21d08687.webp)

11Measure the piston protrusion from the parting surface. • Specified Value: 0.765 \~ 1.055 mm


### Reassembly
1 Install the cylinder head with the steel gasket.


### Notice
Make sure to place the “TOP” mark upward.

![](images/17052b30543061d1752f82a768d76e4f447625c52240d5fea85961429afdcc97.webp)

Tighten the cylinder head bolts to specified torque and torque angle.

![](images/8b053a4f5361c299f677e6706dff18399fa66ae41ddd8f97f1bcc34ce0a124c0.webp)


### Notice
• Apply the oil on the bolt thread when installing.   
•Always insert new washer first.   
•The bolts (12) at vacuum pump side are shorter than others.

3 Install the HLA device and finger follower. Check the HLA device with the diagnosis procedures before installation.


### Notice
•Put the cylinder head on the locating pins.

Tighten the camshaft bearing cap bolts.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11   
• Exhaust: #1, #3, #6   
•Intake: #7, #9, #12

![](images/ce8e26f380db7eccad5f80917f19cf3e33fcc523313a3df4badc540623da03cb.webp)

![](images/2440040296f15520d4cb8a4ae3bfc082140aa9be62b5b25469183e2fd9751ee7.webp)

![](images/2db8d5c42454fcbcd9effc8bf56f6f8c0bded2a09e2fefb4141e4bd36275826b.webp)

![](images/5d724a133b24b40d0178bf3a8c018ac58784f3fe11930114cfa5e74acb170911.webp)

![](images/78ceab3e36a60a593963608c2e8ae5a779b8c2ecd456626a376933c43cdb86c2.webp)

![](images/f922e498129212c1a3f1e1d366823d19a403603ac492f95abd3c06ce34fb9619.webp)


### Notice
Check the finger follower positions and align if needed.

5. Install the intake and exhaust camshaft sprockets and the timing chain.

![](images/755d62ce70843bb3cb26cff463d14518e3e5762af43118504811cef6dbe29f0a.webp)


### Notice
•If the sprocket bolt is stretched over 0.9 mm, replace it with new one.   
•Always install the intake camshaft sprocket first.   
•Ensure that the markings on camshaft sprocket and timing chain are aligned.   
•Make sure that the timing chain is securely seated on the guide rail.

6Rotate the crankshaft pulley two revolutions and ensure that the OT mark on the crankshaft pulley and the OT mark on the camshaft pulley are aligned.


### Notice
If the markings are not aligned, reinstall the cylinder head.

7. Place the bearing cap with the OT marks on both camshafts facing upward.


### Notice
• Apply the sealant on the cap (#12) for the vacuum pump when installing.   
• Apply the oil on the bearing journals before installation.

8. Fit the timing chain onto the camshaft sprockets and install the upper guide rail.

•Instal the clamping guide rail pin.


### Notice
•Install the guide rail with slanted side facing forward.   
•Be careful not to change the timing of HP pump when fitting the timing chain.

![](images/a8d2e1d71d13a0f3b6ec1e2ad000cc9af6c029a0f811b467cd4d5c5cc1220b3c.webp)

Tighten the intake and exhaust camshaft sprocket bolts.

![](images/be58375985cf15dbd5af60b7f6a19603c1ec673ead402d7d039bdf8b9f97b978.webp)

![](images/a0ab46ecb5228b7449cd50789969dfe5c466535a7880c11e4248899f6347903a.webp)

10. Install the camshaft position sensor.

11.Apply the Loctite to the bolt and tighten it.

![](images/395db9b92bc798d99a464fa64b7effdac41aba119f9357b18fc95d207ad0844b.webp)

12.Check the intake camshaft before installing the vacuum pump.

![](images/78dc7dbb861030f0109bf10c703f5ac3a8446300da492ad6077e17b2617d2716.webp)

13. Install the intake manifold. Install the oil cooler with new gasket.

![](images/4706af63a6bcf343168d3bc170e1953dcaf430e89aadf2838b4109b9fb7beb07.webp)


### Notice
Ensure that there is no leaks around the coolant line for #1 cylinder

![](images/905c5c905396f3daf81a926c97d116a004b24e6614205c93dc8b8f9d61bb3873.webp)

![](images/c69a1adcadc5e95ea4295b7cdf2853c388f87eef4cdfdc289fb7eb39d3338a2d.webp)

![](images/f0c54c49564a0a3517279b5dffdf4521ef72b0f4bbc8fb6aa1a9f6fdb485bc6a.webp)

14. Install the chain tensioner.

![](images/9fdcc81606963af0ca7829a0ae21f44d363681eaaf93d52cd8825ef4bbb4c42e.webp)

![](images/62e7ecf7cd0c3eb807679ce825309c2425225756039ad3de9653ea2b94ef1b3a.webp)

15 Install the cylinder head cover assembly.   
16 Install the rubber gasket.

![](images/2c67c09515f7aa5dd63e7d8ffc4fbb1a673ed53a13c8e7ab1ad18cbdbb0babd8.webp)

![](images/2c5823872efa841cee8091df6272571894022c4a5de9e0eb7901034bd949d790.webp)

17. Tighten the cylinder head cover bolts.


### •Apply the sealant to the bolts for the vacuum pump and the timing chain cover.
![](images/9a900d6250de4fb4e9777ea27f2af26f1d4566a179dcd906548ffb8e5b4c3c9f.webp)

1Check the parting surface of the #12 bearing cap and the   
cylinder head for contacting.   
19Check if the O-ring is installed in the vacuum pump.   
20. Install the vacuum pump with the key groove aligned.   
21.Tighten the vacuum pump mounting bolts.

![](images/88fbc0be15b7bb22d5a83dd9b654e2329484421dc1e95f99180e851575c6b6a5.webp)

22.Instal the PCV valve assembly on the cylinder head.

![](images/399d50f097f25f024555bdb9c00d206f57634a1cab5a6b33f7d69781dc365097.webp)

23. Engage the engine oi hose and the PCV valve hose.

![](images/bfbfd9bc16c2aece43ba04cbc4f344580fa9b748bb95eff6cd25bf0ad3482412.webp)

24.Remove the protective caps and instal the new fuel supply pipes.


### Notice
•To keep the cleanness and protect the components, the fuel pipes should be replaced with new ones. •Be careful not to be mixed the fuel pipes because the pipe appearance of #1 and #3 cylinders and #2 and #4 are same each other.

![](images/bf3a53d9e6e7af334a7b06a6a73ad6704fd66237b5e655910bd7354fe79c7976.webp)

![](images/5be034a8f03ad3dc2ca7ca89834b393bc804b3245d1b85663c00a4fe8c307908.webp)

![](images/ce006a997200e448dd0e0a59b4228c047baafc59a4f49b822acff0f07d23e377.webp)


### Intake/Exhaust - Removal/Installation
Remove the cylinder head assembly.

![](images/83bc172c67740c282abf84f016ee5c386916ffe031f5b7434a9a6e1c15984e86.webp)

Instal the removed cylinder head on the assembly board (special tool) and set the supporting bar and lever (special tool) on the cylinder head.

3.Push the valve spring seat down with the lever and remove the valve cotter, valve seat and valve spring.

![](images/e8c23bb6875efa5896e2f8f7ec894b862026a86aa53f001622140b5d3277a91c.webp)

![](images/56598659f257148cc19a63cbc6c4399fd087426181f96eba9a2fb0d92f023e79.webp)

Remove the valves from the cylinder head.


### Special Tools and Equipment
![](images/a88bad502ec98fe866946594ffc432153619a9ee07e321dbbd6d8c849fb09f70.webp)

![](images/ccbdf2dc1a155433a30423488f8f054df6a2ef01ea0f784f8d78b8ff2271ed80.webp)

![](images/0217781d5e46a9c6f2b46c347951399cc35c744d9546002e6a11672234b227cc.webp)

![](images/0a0dab5af50173991647969ee04a04caab19ce636a389801ff776d602a1c332f.webp)


### CAMSHAFT ASSEMBLY
\* Preceding Work: Removal of cylinder head cover

![](images/e8e7bdf01c928a0909c9c1d9fef546baa8f3b2ea56676ef7eef29dae3507192f.webp)

![](images/2a11304983b4ba87828d78d357feba8bd1ced5bb6e716cc91e7f6fa3f1a55f25.webp)


### Camshaft Position Sensor
![](images/612c92b37febd1ec0e032af31eac0b6f3ac06feb9aadf43ebb8262f0a4779ce1.webp)

The camshaft position sensor uses haleffect to set the camshaft position and metallic-magnetic-material sensor end is attached on the camshaft and then rotates with it.If sensor protrusion passes camshaft poition sensor's semi-conductor wafer, magneti field changes direction of electron on the semi-conductor wafer to the current flow direction that passes through wafer from the right angle. When operation power is supplied from camshaft position sensor, camshaft hall sensor generates signal voltage. The signal voltage wili be OV if protrusion and camshaft position sensor are near and 5 V if apart.

ECU can recognize that the No. 1 cylinder is under compression stroke by using this voltage signal (hall voltage).

The rotating speed of camshaft is half of the crankshaft and controls engine's intake and exhaust valves. By installing sensor on the camshaft, can recognize specific cylinder's status, compression stroke or exhaust stroke, by using camshaft position when the piston is moving toward TDC (OT). Especially when started first, i is dificult to calculate the stroke of a specific cylinder with only crankshaft position sensor.

Accordingly, camshaft position sensor is necessary to identify the cylinders correctly during initial starting. However, when engine is started, ECU learns every cylinder of the engine with crankshaft position sensor signals so can run the engine even though the camshaft position sensor is defective during engine running.

![](images/03b3b51332e6682cee388d61c74a7ef7cd1b2fa0375877f39af5623a7eb010e4.webp)

![](images/5b9d4e6174b24108af10debcb7794557bf445cd069323588e759a8be2ea1fec8.webp)

![](images/f8a2311016c4d13a0054c9b00333a9ad48faf474e1cb283d65a08a6c4a5fc003.webp)


### Removal
Preceding Works:

-Removal of fan belt -Removal of fuel supply and return lines -Removal of intake manifold mounting bracket

1. Remove the injector fuel line and connector, and glow plug connector


### Notice
Plug the openings of injector holes and common rail with the protective caps.

Remove the cylinder head cover.

![](images/fe06edd6538547c251f0478706bfc6ed28f66461c6c72c0f29e331dfe6df5aad.webp)

3Remove the camshaft position sensor.

![](images/8d172a4dcda3349c71b21d9a73657d196b7066bf96deee96334a776bdcbc7d09.webp)

![](images/5cb4543f167ff1bd037922d78b022ab1699335df30cf3b4bc7993dcfb39c25c5.webp)

4. Mark on the intake camshaft sprocket and exhaust camshaft sprocket for timing setting during installtion.

![](images/b9309816868325d11bacfe9989db1c20df94404615c15f063600b44e7a9b65ac.webp)

5Remove the chain tensioner.

\* Preceding work: removal of EGR pipe and oil dipstick tube

6. Hold the camshafts and remove the intake camshaft sprocket and exhaust camshaft sprocket.

![](images/b1d4148eebcb2439fa90204b560b76c96f1f04f5c3ba06893ae0a904c4446309.webp)

![](images/4214be45d1137eb5dac9202ea4873867934da84ba17eb8cf654d2808d8a1a422.webp)

7. Remove the camshaft bearing cap bolts so that the tightening force can be relieved evenly.

Intake: #1, #3, #6   
•Exhaust: #7, #9, #12

\*However, there is no specific removal sequence.

• Intake: #2, #4, #5   
• Exhaust: #8, #10, #11

\* Do not remove the bolts at a time completely. Remove them step by step evenly or camshaft can be seriously damaged.

8. Remove the intake and exhaust camshafts from the cylinder head.

![](images/aa769cbc0186d6294f0e0f1a63294d7fea52a56f9bd4f5e28ec1d4745591c01e.webp)

Remove the finger follower and the HLA device.


### Notice
Avoid contact with hot metal parts when removing the HLA device immediately after stopping the engine.

![](images/fa2c497970602e4e8550d44adc93920b0bf4d503e3df63fb22a03471707bf66a.webp)

![](images/c90d9d7629104f4fed50f16dc4bb32c25bd0326c517e8a2a71d8df290d0e9771.webp)

![](images/45c4ba61a9488407da759c89c7842901015c20972a083efab0ef0e0e3f708ede.webp)

![](images/e0832eb1fb26acc8a48eb8bc5571620cb380968927313aaa6c40654fea4492be.webp)

![](images/bcf8cf1f519dd1b10effbeeb25d965b7d15aba5f6afc921169b3e03c3cf9c06b.webp)

![](images/d0e38e5993d72df076d9abbec6d9c405efde9a43299a6a18f27c2f4db4bfd3b5.webp)


### Installation
1. Install the HLA device and finger follower. Check the HLA device with the diagnosis procedures before installation.


### Notice
•Put the cylinder head on the locating pins.

2. Place the bearing cap with the OT marks on both camshafts facing upward.


### Notice
• Apply the sealant on the cap (#12) for the vacuum pump when installing.   
• Apply the oil on the bearing journals before installation.

3Tighten the camshaft bearing cap bolts.

•Intake: #2, #4, #5   
• Exhaust: #8, #10, #11   
•Intake: #1, #3, #6   
•Exhaust: #7, #9, #12

![](images/e4a5f9f0d2666df68474968ff41d21c35b6ab4eaef77bc5be600e19b9aa47cfd.webp)


### Notice
Check the finger follower positions and align if needed.

4. Install the intake and exhaust camshaft sprockets and the timing chain.

![](images/7e4303148a2c8757e536334238dd53936fb1fa9524e506fd798a96a9a3a0cea5.webp)


### Notice
•If the sprocket bolt is stretched over 0.9 mm, replace it with new one.   
•Always install the intake camshaft sprocket first.   
•Ensure that the markings on camshaft sprocket and timing chain are aligned.   
•Make sure that the timing chain is securely seated on the guide rail.

![](images/03b453ce732fb091c0acbfbda49e74dfed3deb77b1c4992b4e7a346cae2532eb.webp)

5Rotate the crankshaft pulley two revolutions and ensure that the OT mark on the crankshaft pulley and the OT mark on the camshaft pulley are aligned.


### Notice
If the markings are not aligned, reinstall the cylinder head.

![](images/c77fda9805e021cbe885c36e5e55b6f882afe6fde078656cb26f274670bd2478.webp)

6 Install the chain tensioner.

![](images/e0615500481b35dd38952cbf0ff4fec3e9eed22c76b567b97b9d3312b058e317.webp)

![](images/be0e613e3b650e918f7605a0a77bccf4003be158aa97ebe7a9082212ab804673.webp)

![](images/05b3cb5762204a2dd24ad53d0c1b080f6df4263a2851326f221795c691eab84c.webp)


### Special Tools and Equipment
![](images/934b1897c317b1d3672a7e3e0b2f22238aebde80e901b0c06a2c2451b6002a1f.webp)

![](images/c88a6229409c71de1f5f4987283af48627bfda73fad13a475e340767818e38dd.webp)


### TIMING CHAIN ASSEMBLY
Chain Drive System

System Layout

![](images/0d998db0e47467309d29181f25cdf44446215224885ed80878a80c49ae4946dc.webp)

Y220_02084

1. Exhaust camshaft sprocket   
2. Upper guide rail   
3. Intake camshaft sprocket   
4. Clamping guide rail   
5.HP pump sprocket   
6. Lower guide rail   
7. Oil pump tensioner   
8. Oil pump sprocket   
9.Crankshaft sprocket   
10. Oil nozzle   
11. Tensioner guide rail   
12. Chain tensioner

![](images/6bbc2b69437e6f48836882b8cc3f829c49ef2eef0a2454f0326e7aa3f37a944d.webp)


### Chain
Chain type: Double Bush   
Pitch: 9.525 mm   
•Load limits: 19,000 N   
No. of links: 144 EA   
• Overall length: 1371.6 mm   
Replace when the chain is extended by 0.5 % from overall length (Replace if extended by over 6.858 mm)


### Chain tensioner
![](images/c01311e3ce427c3758ed6fa6ab1a16290fb60a7849ff13a3bfa5205f1b3d620f.webp)

Y220_02085

The major function of tensioner is optimizing the movement of chain drive system by using spring constant and oil pressure in the tensioner.   
The tensioner performs function of adjusting chain tension to be alwaystight, not loose, while engine running. By doing so, can reduce wears of each guide rail and sprocket.

![](images/699d57e3d0cfdb661541e2a4a201384ed2c526971c010f87d1887abbd77428c5.webp)


### Guide rail
Guide rail is used to optimize the movement of chain drive system like tensioner.   
Guide rail can prevent chain slap when chain is extended and reduce chain wears.   
Guide rail is needed especialy when the distance between the sprockets are too long.   
The material is plastic.

•Location of guide rail

-Tensioner guide rail: Between crankshaft sprocket and exhaust camshaft sprocket - Upper guide rail: Between exhaust camshaft sprocket and intake camshaft sprocket - Clamping guide rail: Between intake camshaft sprocket and HP pump sprocket - Lower guide rail: Between HP pump sprocket and crankshaft sprocket

![](images/a9d505bc2631a2264e585078ba46448108a292c794621a111429b24ddd64f082.webp)


### Timing setting
![](images/c3f21494ae561e67c1de57a7014572eb2ae91459b68e7553d36a57bacc619af9.webp)  
<Timing marking points on chain>

Y220_02086

•Check marking links on the chain (Gold marking)   
•Locate a point with two continuous marking links and align it to a marking on crankshaft sprocket (^)   
•Align respective marking link to each camshaft sprocket (intake and exhaust) marking ()   
•Align another marking link to HP pump sprocket marking ()

![](images/6047598aec790366b45e57b6c655377018b169cb8708b8795e201306c03eece1.webp)

![](images/40cd5a4d03f1228ccfb00ac7e6bffc8c930e68c7bf8f573af3f03edb3444357a.webp)

![](images/bed82c39bfd3fb0414144cbd7b0265922d88880172c460b3e8ba0b856cce7413.webp)


### Removal and Installation
1.Remove the cylinder head assembly.   
Remove the oil pan.   
3Remove the chain guide rail with a sliding hammer.   
Remove the chain cover.   
5Remove the oil pump drive chain.   
6Remove the upper guide rail while pushing the retaining spring with a screwdriver.   
7Remove the lower guide rail.   
Remove the oil pump drive chain.

Remove the tensioning guide rail.

![](images/e58dfa7e1a80c6a6c2fb50e1f91daa8a0fbbfea91a2fc60889c1834417edd15f.webp)

![](images/98952d39341e7663adda5e625d52721c8d975b4c1c3b7af3f7951e42e358825e.webp)

10Remove the timing chain.   
11 Install n the reverse order of removal.

\* Thoroughly clean the removed components before installing.


### CYLINDER BLOCK
Deep head bolt thread to prevent the

![](images/19d0b6f5d15bd3ffc2d27122b3ddee189ee1343216e2f5082773c9568137eb56.webp)

Y220_02091


### System Characteristics
Rib design by considering strength against engine vibrations and weight   
•Cambering type skirt design on case housing wall to reduce the engine noise   
•Water jacket design to increase the cooling efficiency of cylinder bore bridge   
• Deep head bolt thread to prevent the deformation at cylinder bore surfaces

Reinforcement of strength - Main bearing housing / Main bearing cap - Extended main bearing cap bolt

•Reducing the noise, vibration and harshness (NVH) -Minimize the vibration by adding external ribs -Adding the ribs around oil pan parting surface

![](images/9e629fa88d713b970d802e6572bc1fbba06f9e992564ff1dcb25d696e18c5e62.webp)


### Knock Sensor
Two knock sensors are located on the cylinder block (intake manifold side).

To detect engine vibration under abnormal combustion, knock sensor has piezoelectric element fixed on the vibration plate and this vibration plate is fixed on the base. If happens knocking, pistons or connecting rods vibrate and occurs heavy sounds that hit metal. Knock sensor is used to detect those knockings caused by abnormal combustions. It controls idling stabilities and turns on the engine warning light when detects injector damages. And also controls pilot injection very precisely during MAP learning.

When knock sensor is defective, engine ECU corrects injection timing based on MAP values like engine speed ntake air volume and coolant temperature.

Before checking the knock sensor unit, be sure to check the tightening torque of the sensor and connector connecting conditions.   
![](images/74cbd9d2e3301a99700d21307f21493ab90eab576565efca3292bd83fb2dbe1f.webp)

![](images/10b18c9904c7eb6fdd0f9a08bae326e80f4bfab43bb05a2c799ee87b4f852305.webp)

![](images/fa44dd6685fd76737435056e07d44c530149af66b3bc5dc0ebf10a2461ea6e98.webp)


### <Location of knock sensor>
Y220_02092

1. Sensor housing   
2. Nut   
3. Disc spring   
4. Weight   
5. Insulation disc   
6. Upper contact plate   
7. Piezo element   
8. Lower contact plate   
9. Body   
10. Terminal   
11. Resister

![](images/331216d8dc294959a317d89cacd3926aa3e9288f8f5f4960aa0c97a3fc6602af.webp)


### Notice
The knock sensor should be tightened with the specified tightening torque. Otherwise, the engine output may be decreased and the “ENGINE CHECK” warning lamp may come on. The internal resistance of the sensor is approx. 4.7 k2.

![](images/afec436112df840a143f4fec2ff32173f760e2169ac46890215362a2f7aab6e9.webp)

Y220_02093

![](images/9c9e4fde1378498d70c59fd0299fb4bae2f9c7966dfecc14402197e0d3bb6cca.webp)


### CRANKSHAFT
\* Preceding Works: Removal of end cover Removal of pistons Removal of crankshaft sprocket

![](images/6700c8e5ff5e317e4e6dfb7b2ceb652028321780ec46f95afebf2d104ea12872.webp)

Y220_02094

3. Crankshaft main bearing shells, upper   
4. Upper thrust bearing   
5. Crankshaft   
6. Crankshaft main bearing shells, lower   
7. Lower thrust bearing   
8. Crankshaft main bearing cap   
9. Crankshaft thrust bearing cap   
10. 12-sided stretch bolt....55 ± 5.0 Nm, 90° + 10°

![](images/8b9281d32e192c1f9c9990522d00b71901d03badc6267689d4485f2bf303e8c7.webp)


### ARRANGEMENT OF THRUST WASHERS AND BEARINGS
![](images/35884a750e486a54813d497aa37e2c3ce0ae70025443df9dfe238a4ba1c43c38.webp)

Y220_02095

1.Crankshaft   
2. Crankshaft main bearing shells, upper   
3. Upper thrust bearing   
4. Crankshaft main bearing shells, lower   
5. Lower thrust bearing


### Notice
The clearance between bearing shell and bore and between bearing shell and journal are various. Refer to the table on next page to select bearings when installing.

![](images/817e05475889136c24c320f960336308c71a99c57e233d83dab47cd6a2aba2c4.webp)

Dimensions of Crankshaft Main Bearing   
![](images/84deea0637d5743047ff162d57d8a94d53003caf70aa9c45c7e96094f58cee08.webp)


### Bearing Clearance
![](images/8b4d1d1128f90a69b290d62610706186a1a699f89ef6fd18562b55fecdc53693.webp)

![](images/5704e44c1ae27fd73b680d5dc9fa56eb6c51c83db7d51c8b78310e5ce23a2ada.webp)


### Notice
Measure the crankshaft axial clearance and correct if necessary with appropriate thrust washers.   
Thrust washers of the same thickness must be installed on both sides of the fit bearing.


### Matching the Crankshaft Bearing Shels to Basic Bearing Bore in Crankcase
![](images/e99b3fcf4ccfc87d7d440c53e6ec2e7fdb399ea1c36adcedddb034f88f81215e.webp)


### Matching Crankshaft Bearing Shells to Basic Bearing Journal of Crankshaft
![](images/e47283acb1cb8a4157dc5fbbe36664c4dc63f30423fb3d59c4a8941faf537398.webp)

![](images/77dca8d7f4f994bd2c2f1b0c5cc0f884114c66f486880cbb8f4fe89c91c549e4.webp)


### Selection of Upper Main Bearing Shell
![](images/6044e87fe49ca8b13a211da80184b086a082ec3690595c47a9ddcf7dacd61113.webp)


### Selection of Lower Main Bearing Shell
![](images/a545020a2897fc8cb3030d7f313a1bb4a12f483363e7e83935a60f006d8338e7.webp)

![](images/7f087bb9eed113a52725939ba3e545ed98e3059a9a50d17de299b670f1c71523.webp)

![](images/33c9a0f83ed677aa59a6b72d365edf61ec7d4e01ffda9c5fd5f0c8b820e3f377.webp)


### Crankshaft Position Sensor
![](images/fc3eb265991aadfd99cfc98813989bd1660be31cbf918034843708f1f30feceb.webp)

Y220_02098

The crankshaft position sensoris located near to flywheel on the rear of cylinder block. I generates AC voltage between increment type driven plate that fixed on flywheel inside. The sensor consists of soft ron core that winded copper wire on permanent magnet and generates sign wave AC voltage when magnetism on the sensor wheel passes the sensor.

When the crankshaft rotates, 't' signal willbe generated from near the front edge and 'signal wil be generated from near the rear edge among teeth on the driven plate near to crankshaft position. The AC voltage increases as the engine speed increases, however, no signal occurs from the 2-missing-tooth on the increment type driven plate. By using these teeth, ECU recognizes TDC of No. 1 and 5 cylinders.

ECU converts the alternative signals into digital signals to recognize crankshaft position, piston position and engine speed. The piston position that coupled with crankshaft is main factor in calculating injection timing. By analyzing the reference position and camshaft position sensor, can recognize No. 1 cylinder and calculate the crankshaft speed.

![](images/90e9d4ff90f0e0ae6b256655ab7c6d7242374934d92709da1e24ab7e9dbf63ae.webp)

Y220_02099

A. Distance between 't' max. voltage and -' max. voltage

a. Front edge b. Rear edge c. 2-missing-tooth

![](images/6276a43ac5181d49e2a8398dc58a0d3e8aa73a754cf79d74273751e153675ebc.webp)

![](images/54aec876b712298d894731df3ebe5f0e94cfd56a451878917fa8beb6d1d83cc0.webp)  
<Circuit diagram of crankshaft position sensor>

Y220_02100

![](images/2af34c8438586f7d7e6d85cebf4a5538c70db6b4f190df774361c9c55fa33886.webp)

![](images/f01c384ced94ccfdb3cceeb9627e4d130b4470b08c9cf1110279de974c2c0671.webp)


### TORSIONAL VIBRATION DAMPER
![](images/c8a4bf290d32e31e09e96917efebb2e9db939571e46a8619db220d620c1faf79.webp)

Y220_02101


### System Description
•Components: Hub, inertia mass, cover, bearing, bushing, silicon oil •Functions: The crankshaft pully optimizes the drive system by reducing the amount of torsional vibration in crankshaft. Conventional rubber damperi limited in changing materials (rubbers) to absorb vibration, but this crankshaft pulley (viscous damper), using silicon oil, takes advantage of less changing viscosity according to the temperature.

![](images/b40037c290e1c433d32ffc1fd03c5189f9b8fa7dc364e2e423b26d770a54e516.webp)


### Crankshaft  Disassembly
Unscrew the bolts and remove the connecting rod journal bearing and bearing caps.


### Notice
Position the #1 piston at TDC and remove the piston connecting rod journal bearing caps.

Remove the bearing cap bolts.   
Remove the bearing caps.


### Notice
•The crankshaft bearing caps are marked with stamped numbers. Start to remove from the crankshaft pulley side. •Do not mix up the bearing shells.

Remove the bearing caps and lower thrust bearing.

Separate the lower bearing shells from the bearing caps.

6Remove the crankshaft.

7Remove the upper thrust washers.   
8Remove the upper bearing shells from the crankcase.


### Notice
Do not mix up the bearing shells.

![](images/40c2c65507bbff23b6aa01732deb2758d4b3aa08edd11d9bf2a9ae4bd1ff1bed.webp)

![](images/46dbd1b9febc85efa7288744392837ab3b8fca10d2c759af29b84f3d012a6022.webp)

![](images/e9755fe4c1b9fb54294952e2e5c479110a35ff1a1158eb63a7c3b8c4aa08a9c8.webp)

![](images/da9dc9bed7987bff0fc52d2c8598842e0608a0bc4ce6ec4686b7498be43c3229.webp)

![](images/2287fe0c8037d3f632462be4069892b24750f8122a95813c826eeec8703f8120.webp)

![](images/0f76df851504f28be32088e8de7f887abf1d81ec87ee70433f3f2fe8c3c9fcc8.webp)


### Crankshaft  Reassembly
1 Thoroughly clean the oil galleries and check the journal section and bearings. Replace if necessary.

![](images/534d073d39d98925af464e119a8113192c1d60ecf9ca467487c33c80967f35fa.webp)

2.Coat the upper thrust washers with oil and insert into the crankcase so that the oil grooves are facing the crank webs (arrow).   
.Coat the lower thrust washers with oil and insert into the crankcase so that the oil grooves are facing the crank webs (arrow).


### Notice
The retaining lugs should be positioned in the grooves (arrow).


### Notice
If the maximum permissible length of L= 63.8 mm is exceeded, the 12-sided stretch bolts should be replaced.

![](images/374c3e80795bf80298a93f7d3ba1398695d3f3368ff09f64449ecdeea1af4ebc.webp)

![](images/c8dc2523f6b5cfca579e8095dda8b7bd75095904c16cc6a1db8847880ab8c380.webp)

4. Coat the new crankshaft with engine oil and place it on the crankcase.

5. Install the crankshaft bearing caps according to the markings and tighten the bolts.

![](images/a7ddb7279441458f8453ec30738eedf0b69c6e933caf78b5aeec80daf7855880.webp)


### Notice
Install from #1 cap.

6Position the #1 piston at TDC and install the crankshaft.

7. Install the piston connecting rod journal to the crankshaft journal and tighten the bolts.

8Measure the crankshaft bearing axial clearance. •When new: 0.100 \~ 0.245 mm • When used: 0.300 mm

9. Rotate the crankshaft by hand and check whether it rotates smoothly.

![](images/085c61338d755a0bb96a9efef6515424cfc628e12d4cca0c70586100e61e3895.webp)

![](images/2c0aec8057c6535675d33df338171ec6e353ff8f86bc47032dad0fd3ce9b8bff.webp)


### DUAL MASS FLYWHEEL (DMF, MANUAL TRANSMISSION EQUIPPED VEHICLE)
![](images/f00d87f933132b795420d986a14c1e545c96a9f4233a7716af5496ec1d240202.webp)

Y220_02111


### System Description
This flywheel is installed to the rear end of crankshaft and transfers the output from the engine to the power train mechanism. When starting the engine, this drive the crankshaft train mechanism initially by using the power from the start motor. Also, DMF measure the crankshaft speed, sends the signals to ECU, and controls the ignition timing.

![](images/3e1fe406e169407ff797c2d1cc2fbae0c20ebb66e7efb1f0c6da3ee6750441ec.webp)

Y220_02147

![](images/300705928d567fdb2e2bf11e14af5dd3c50f42e2cfe3c2a981f2081399fef416.webp)


### Function and characteristics
•When the output changes from the engine is high during power stroke (l): The damper absorbs the shocks to reduce the changes to transmission. • When the output changes from the engine is low during compression stroke (2): The damper increases the torque changes to clutch.

![](images/893d8ad8d86ba17d05f499c07e4e5756c502c42231676e57cfa58e4b2c50a6b9.webp)


### <Torque change curve of engine and drive shaft>
![](images/9b8efd386cfd673fce46bf4942e44f5042fd2ff0770e58a8399f0c0528fe889e.webp)

Y220_02113


### Function
Filters irregularities of engine: The secondary flywheel operates almost evenly so does not cause gear noises • The mass of the primary flywheel is less than conventional flywheel so the engine irregularity increases more (less pulsation absorbing effect) •Transmission protection function: Reduces the load to powertrain (transmission) by blocking the irregularity of engine


### Characteristics of DMF
Reduced vibration noise from the powertrain by blocking the torsional vibrations   
Enhanced vehicle silence and riding comforts: reduced engine torque changes   
•Reduced shifting shocks   
• Smooth acceleration and deceleration


### Advantages of DMF
•Improved torque response by using 3-stage type spring: Strengthens the torque response in all ranges (low, medium, and high speed) by applying respective spring constant at each range.   
•Stable revolution of the primary and secondary wheel by using planetary gear: Works as auxiliary damper against spring changes   
• Less heat generation due to no direct friction against spring surface: Plastic material is covered on the spring outer surface   
•Increased durability by using plastic bushing (extends the lifetime of grease)

![](images/178a6b9df013f33c1262e78ecabfcf246d6160f57d6b07a6672cdf03d34df264.webp)


### PISTON AND CONNECTING ROD
![](images/6814055d730ca63f65d70a22f3789670eb6cef9b9c5878494af1e48e7b7e1297.webp)

Y220_02114

1. Piston   
2. No.1 compression ring   
3. No.2 compression ring   
4. Oil ring   
5. Piston pin   
6. Snap ring

![](images/7469464e0b77c175eb92b0b14e6a840f87774a1589149fd9ab5f4b3d373044b4.webp)

![](images/533ab0278a180872285de733dd1364a7bba776ed486570d700100b2ed24f37c0.webp)


### PISTON RING
1.No.1 compression ring   
2. No.2 compression ring   
3. Oil ring   
5. Coil spring and oil control ring   
6. Hook spring

![](images/3b1fd3f21da4acb40d2ae30aafe44712baa7a753a93ab5738331dc05c9a47805.webp)


### Replacement of Piston Ring
•Measure piston ring end play.

- Piston ring end play (mm) 1st groove: 0.20 \~ 0.35 2nd groove: 0.20 \~ 0.35 3rd groove: 0.20 \~ 0.40   
-Clearance between piston ring and piston (mm) 1st compression ring: 0.075 \~ 0.119 2nd compression ring: 0.050 \~ 0.090 3rd oil ring: 0.030 \~ 0.070   
• Install the piston so that "Y" marking on piston head is facing in the direction of travel. Arrange the piston ring ends to be 120° apart.   
•Adjust the hook spring joint in the oil ring 180 ° away from the ring end.

![](images/94cb679dce92b9e6a7b533868fc739d7eeaf6efdff9734eff9777ac513dcc712.webp)

![](images/879ddcfe0858e61cac2939aab200a19f23cef911b1081553bea30061fadb1a85.webp)


### CYLINDER INNER DIAMETER AND PISTON SIZE
![](images/a1d569bfb97fcccb92be6b8428fe269f303589f4e023e41e55290826ab4eebea.webp)

Y220_02117

(Unit : mm)   
![](images/7800b7a26574cad1884d1d95d54a24dface26a91c7515b4ab206a196f7cf328a.webp)

![](images/88858c2dd4014f0da5d9babe5d68b8b8ffbdb63931cc9efbf73aa8e78c0d6a94.webp)


### Piston - Reassembly
1. Install the compression ring and oil ring on the piston with a special tool.

![](images/40e46e6b5c3e743fbed6409c75d1589b3ccdbda0f362f14aa17950145e76ab48.webp)

Arrange the piston ring ends to be 120° apart.


### Notice
•Install the No. 1 and No.2 pistons so that “Y” marking on piston head is facing upward.   
• No.1 piston ring is thicker than No.2 piston ring.   
•Arrange the oil ring end to opposite position of current ring end.   
• Oil ring is not directional.   
•Make sure that the piston ring end is not aligned to axial direction and lateral direction.

![](images/cd2b51fc5647da9ad647b53c0d3098952b198193e2d92f36bdd44c6171ff185b.webp)

Y220_02119

Check the clearance of piston oil ring and compression ring with a thickness gauge and adjust if necessary.

![](images/f89a9185e4bb1bbb44f33e4564694ac0bb39c5ad7a926a87b60f0cd2c7435827.webp)

\* Piston ring end play (mm) 1st groove: 11.0 mm 2nd groove: 10.5 mm 3rd groove: 7.0 mm

![](images/c185727fba2b33d71ea0160390a718e3c6a44c2aae798a1ac1effa6e81faddcb.webp)

3. Check the clearance of piston rings with a thickness gauge and adjust if necessary.

![](images/5fdc62e212dfd7a08a705169c83ba28abde04a777cfcf36d4a922582b663a1ce.webp)

![](images/21d67491fa5704a9b72c3f82682e8509cd760db9dfce67afc7ee0a0c9e9b7654.webp)

![](images/963e2e8dc80edf727093262caf258fe2a7f433d46d8670a097b2b9e92c46bb5f.webp)

![](images/45e7aba17d534c5e0a0579f18ee568c564ce7b79bf2d2c7561507afc44371f61.webp)

![](images/70c4e59fddfba6578422ed1a77a3e19d2e33e832bb185e7f8f69edd39620037d.webp)

![](images/2180da3cb4e994fb58f7caed9b8ed1496837ea7b3878e2410cbe2266a0b1333a.webp)

4. Fit the piston onto connecting rod so that the marking on piston crown and locking slot are facing to straight ahead direction.


### Notice
Install the piston so that the piston recess (marking) or the stamped surface of connecting rod is facing to straight ahead direction.

5 Lubricate piston pin and push in by hand.

Notice Do not heat up the piston.

Place new snap rings into the grooves.


### Notice
The snap rings should be replaced with new one.

7. Lubricate the cylinder bore, connecting rod bearing journals, connecting rod bearing shells and pistons.

Push piston into the cylinder with a wooden stick.


### Notice
The marking on the piston crown must be facing to straight ahead direction.

Insert connecting rod bearing shells.


### Notice
•The upper and lower connecting rod bearings have same appearance. Therefore, make sure to check the part number before replacing them. • Install bearing rod bearing cap so that so that the retaining lugs are on the same side of the connecting rod bearing.

10. Measure stretch shaft diameter of the connecting rod bolts.

![](images/f0578b811ec67db43151f733dd27101a5c1ca63cae4bf361f2209dfa2b4c7e2b.webp)

![](images/06f091ba118d5232b40596903902478e2e4821943f50a69295cefa850a9dc0e9.webp)

11. Lubricate the new connecting rod bolts and tighten.

![](images/8bab7ff720c00d4194e9fcd2c8d5094b973e681492bdf3d38405312d4a8bec22.webp)

• End play of connecting rod cap

![](images/148868dd08c096d5180bfcf19d66d5869374c45a76289ed60ef74f1dcab81f27.webp)

![](images/4bda262d3a0194205a36c06ffca1710c50e33df5bb99e4d5854e85d65710dbda.webp)

12. Position piston to TDC and measure the distance between piston and parting surface of crankcase.

![](images/d0fd2615eb0c83db0729358007d6f8193d371cb4fa85cbd2550b113510f5dcd4.webp)

•Measure at both ends of axial direction.

![](images/8083acdcbc3103d6e49c6208a926f98a49a614bf9edb087f5aa3c496f8393bf5.webp)

![](images/599ddc04b0bb886126c3f3c52b5ade8450d2f7617f59c09400f5248768c6de33.webp)


### Special Tools and Equipment
![](images/b58360bdaf747efe99a042887da226e875b7e500869218c96b4b0b2722a05cf0.webp)

![](images/f4e7310edd7c6f3cee25bfe4a28d27e31818ebf1bb35a7e65c1f479a570085a9.webp)


### COMPONENTS LOCATOR
![](images/fdb09b27e79d3d547d481f50e086395e03e469e18ce2bb0ab9ae63158c01c5a3.webp)

Y220_02133

1. Inlet Metering Valve (IMV)   
2. Hydraulic pressure head   
3. Plunger   
4. Drive shaft and cam ring   
5. Housing   
6. Roller and shoe   
7. Low pressure pump   
8. Fuel temperature sensor   
9. Venting   
10. High fuel pressure supply line   
11. Pressure regulator

![](images/20f29dd136e3b12c3141f06a608f91ba82d9ec619910dfc8ff5677cb2f4a08fd.webp)

![](images/f2f92448372755d98039c154b9c417e57cee2ca07e221c1384d00483b18acfd3.webp)


### HP Pump - Disassembly and Reassembly
Preceding works:

- Removal of fan belt (including cooling fan and fan clutch) and fan shroud   
- Removal of intake manifold assembly   
- Removal of water pump pulley   
- Removal of auto tensioner   
- Removal of EGR pipe   
- Removal of oil dipstic gauge


### Notice
•To prevent oil leaks, store the removed auto tensioner in upright position. •Be careful not to damage the rubber bellows. • Plug the oil ports for HP pump with sealing caps.

![](images/ab9ef33651ce59f80b9c290fc783764d4496b9a6f7463e1c1a0a83afcf182cc6.webp)

Set crankshaft pulley to OT point. Open the oil filler cap and check if the cam shaft notch marking is aligned to OT point.

Remove the cooling fan idle pulley with a pulley holder (special tool).

![](images/548899e9c4d3a0898badb15a4bde39be7a9cd170aa42caddf9cb2f9f35d82ade.webp)

Remove the cooling fan bracket assembly.


### Notice
Be careful not to get the sealant or foreign materials into the engine.

![](images/7615cabe5e27fb29551ae7fe199f21751d3271ee83e0c51c4a1da9b79b04fef3.webp)

4.Place the marks on the chain and HP pump sprocket for installation.

5. Remove the vacuum modulator bracket. 6. Remvoe the fuel pipes and wiring connectors which connected to fuel pump.

![](images/90b2c9f9fa308c1ba3fbd174f3e0dcd6d0efbda354844e37751d01ed4dba86f0.webp)

7. Turn the crankshaft pulley to the counter clockwise direction to ATDC 45° then remove the chain tensioner.


### Installation Notice
![](images/de09d92f2c0039044267d9d4c8a2317d3f0c3ff71f85a2a0fbca3f7e63a2e7d3.webp)

![](images/6197bd6cc8e9283899847611628b6ce8c356edd07b2e73dc3a392b5cb127b341.webp)

![](images/e4243917e8587d8429103d44b080c0e74a4286d1c5daf25b80dabf868e78d1a0.webp)

8While insert finger and push the chain guide backward direction and turn the crankshaft pulley to ATDC 65° by counter clockwise direction until feel the chain guide inclined backward.

9. Install a special tool into the cooling fan bracket hole to hold the sprocket.

![](images/0ae4ce8b301a73c546b7883914f899ed12ad3e52bb2e6237554d12c4cdcdb0b9.webp)

![](images/6cab9d9fd6f40a98fa2c178805304b1a2841b93fe64d9ba0654d43f32e312ef5.webp)

10. Remove the sprocket bolts and center nut and after slightly lifted up the chain, remove the pump sprocket.


### Installation Notice
![](images/a2ae790acd1dbd881567d306f57c7e12627581ca7298dce617118b8736c531ac.webp)

11. Remove the HP pump bearing with HP pump bearing puller (special tool).


### Notice
Do not apply excessive force. The timing chain may deviates.

12. Remove the HP pump mounting bracket.

Installation Notice

![](images/daedc4d69a3ee74748503c78fd701592eefe49403519c483b3bb822fcbc9ec54.webp)

13. Unscrew the external bolts and remove the HP pump while rocking and tapping it with a rubber hammer.


### Notice
•To prevent HP pump shaft damaging, do not apply excessive impact.   
•Do not apply excessive force. The timing chain may deviates.

![](images/98e2599b457381e285e072d18e9e1add7848a950a99a7cfcfeb27ee14deab997.webp)

14. Remove the HP pump.

15. Instal the new HP pump with sealing caps.


### Notice
Remove the sealing caps only when connecting the pipes and hoses.

16.When replaced the HP pump, initialize the fuel pressure by using SCAN-100. Refer to “Trouble Diagnosis” section in this manual.

![](images/3ed4d6aeb07e1f8af4cdfa89db6845a808632a85c488d0574e248a0b331e66fa.webp)

![](images/c0666c3fbc6ffdc20ac6fe2a683df282bddce22092ee2189c05d7f062f31bc3d.webp)


### Notice
If the initialization of fuel pressure has not been performed, the engine ECU controls new HP pump with the stored offset value. This may cause the poor engine output.

Install in the reverse order of removal and tighten the fasteners with the specified tightening torque.

1.HP pump sprocket   
2. 12-sided sprocket mounting bolt   
3. HP pump bearing housing   
4. HP pump (High Pressure Pump)   
5. HP pump shaft   
6. HP pump center nut   
7. HP pump outer bolt   
8.HP pump bearing shaft   
9. Oil gallery   
10. Bearing bushing   
11. Gasket

\* Tightening torque

![](images/daacc5d244a9037b0ec11212096ed00bc86fff1e10763ca98a6e6554e095f40a.webp)

![](images/673fefb3d857fd1cf972af19c95b7b5a030633b7cf56cae451baa020dea06f1f.webp)


### Table of Contents
AIR FLOWS DI03-3   
INTAKE SYSTEM LAYOUT . ... I34   
Components locator DI03-4   
Air cleaner.. DI03-5   
Air flow sensor   
(hot film air mass sensor) DI03-8   
Intercooler. DI03-14   
Intake manifold assembly DI03-16

SPECIAL TOOLS AND EQUIPMENT .. 317

![](images/0b1698b74abfe56d042a6f7d709391a18c43c97ce5c02458e3f7f1f8054697af.webp)


### AIR FLOWS
![](images/1e5226b8b4382787bd760e4cc07c1431ca4318af5f2f896285711af0b4818da9.webp)


### Work Flow of Intake System
Caer S Cargr Intercooler Maad Comuein

![](images/433d06c897ea6012cee41526b75cdfcac8f8fb1bbbe3dba203771396cf4eb44f.webp)


### COMPONENTS LOCATOR
![](images/58bdf5f478801d81b246ea8e5a1b2a09299f5dea0f2706153ebcdfda5d4d564d.webp)


### AIR CLEANER
![](images/bd43aa067592cd21ace04be63957efdd43c955b6b2cf87cf0ed237fc9d58a4a2.webp)


### Specifications
![](images/0f95d775e0efbe5897e1fab501ea6ebef44455949789b6c6029a4c95cfa17b2f.webp)

![](images/3260fc1b86d326d104678c2736ca7916031273e7b5367437a758918621e46966.webp)

![](images/79e610b7828a9ad1df6e3cad47c98a6c76844fe0f2236dc456b9ee47488a3ebc.webp)

![](images/fdf09d961d72f02b6aa86146fc07d4e5ed3ebb5ad04a7719ce765f7d39d8feda.webp)


### Air Cleaner Element - Replacement
Preceding Work: Disconnection of negative batery cable

1. Disconnect the HFM sensor connector.   
. Loosen the locking clamp and remove the intake duct.

3.Unscrew the screws and remove the air cleaner cover.

4. Remove the air cleaner element. Clean or replace the element as required.

![](images/47e3b44b41bade6b63ae8d8c20a9736120aa80aeb52e5260b62df390a09dc154.webp)


### Air Cleaner Housing - Removal and Installation
Preceding Work: Removal of air cleaner cover

1.Set aside the return hose and remove the coolant reservoir bolts.

Remove the air cleaner housing bolts.   
3 Install in the reverse order of removal.

![](images/9eec1a88b780c6daadc4a687f58dfbc45e15e16ceb379a5fb721c72e0fd00669.webp)


### Air Cleaner Housing/Element - Check
1. Check the air cleaner body, cover and packing for deformation, corrosion and damage. Check the air duct for damage.

3.Check the air cleaner element for clogging, contamination and damage. If the element is partially clogged, remove the dust or foreign materials with the compressed air. If the contamination is severe, replace it with new one. Also, be careful not to contaminate during the replacement.   
4.Check the air cleaner housing for clogging, contamination and damage.   
5. If the inside of housing is contaminated, remove the contaminants.


### Notice
When cleaning the air cleaner with compressed air, direct the air from inside (engine) to outside (ambient air). Otherwise, contaminants can get into the engine.

![](images/8ec4041afe3e5c28222d5ad84cea65f43702f23c1e7583e0fdfbcfa1dfbf2fac.webp)

![](images/6e647f63165990f20fd3378b70490a2b86e57b258568b7148d68c3aac2e367fe.webp)


### Change history
inner tube added + grid (No.3) added + sensing chip changed + sensing section design changed

![](images/da39e8a71832c3b119f11568b24bf02427c42438362a76d61210bac98a19a40e.webp)

![](images/09a8be99cba965289b43107bedf337a9520d21dd1f78c1ca8f8b39c98c2c7b12.webp)


### Results
Durability has enhanced 60 times (lab test results)

<CI type HFM sensor structure>

Y220_03011

1. Plug-in sensor   
2. Cylinder housing   
3. Protection grid   
4. Hybrid cover   
5. Measuring duct cover   
6. Housing   
7. Hybrid   
8.Sensor   
9. Mounting plate   
10. O-ring   
11. Temperature sensor

Air flow sensor is locating on the air intake passage between air cleaner and intake manifold and measures air volume flows to engine combustion chamber and intake air temperature.

And intake temperature sensor built-in the sensor detects intake temperature.

Internal circuit of the air flow sensor is being used to control the voltage value to control the temperature to maintain the heating resistance (Rh) to 160°C that is higher temperature than intake air temperature that is measured by resistance (RI).

emperature sensor of the heating resistance (Rh) is measured by resistance (Rs).

Iftemperature changes occur due to increasing/decreasing intake air volume, voltage of the heating resistance change to maintain the intake air temperature changes to set value (160°C).

Control unit computes intake air volume based on voltage changes of heating resistance.   
Intake air temperature is measured by NTC integrated in the sensor.

![](images/383eda78bb6aefa0eb78cf57ddc333656f99deea524410bb9f01bf96f7f6effb.webp)

Intake air temperature sensor is a part of HFM sensor and a thermister and resister and detects air temperature changes that flow into the engine. There occurs high resistance when temperature is low and low resistance when high (NTC type).

ECU supplies 5 V to intake air temperature sensor and then measures voltage changes to determine the intake air emperature. When air in the intake manifold is cold, the voltage is high and air is hot, the voltage is low.

The reason for using HFM sensor is that this sensor is most proper in controlig accurate airfuel ratio to meet the legal emission regulations. This sensor measures actual intake air massinto engine very accurately during specific instant acceleration and deceleration, and determines engine loads and detects intake air pulsation and air flows.

Main functions of HFM sensor are:

• Using for EGR feedback control   
•Using for turbocharger booster pressure control valve control   
• Using for fuel injecting compensation

CI type HFM sensor: The air flowing the sensor does not directs toward sensing section but flows along with lower wall after passing protection grid to enhance durability of the sensor. Oil, water and dust less damage the sensor.

![](images/336d4f9d4029ebe7b2d7ab7a43db960fe71c6c28fa9f403eb95082eefd2ea3fe.webp)

![](images/e1aa41b3838d355a892e6e8c54928870bc2151381065cd8bcd207ca43c3c5ee7.webp)

![](images/30f1dbb949090cc93695c860372b64e1c6de3c6a14405fdbbfd720e2c9aba57c.webp)

Y220_03013

![](images/3ef7a6fa980c2cea86a6750627e864cc0ea65baff52efe8879a0e7db0b100523.webp)


### HFM Sensor - Removal and Installation
![](images/8719616015360f63310babe02117779fc9bfe44931dc7a3f42023f3199ad1cd5.webp)

Preceding Work: Disconnection of negative battery cable

Disconnect the negative battery cable. 2. Loosen the clamps on the air cleaner and the turbo charger and remove the duct.

Unscrew the bolts and remove the HFM sensor assembly.

![](images/a0bde4584a45af1f3790f915f5edcdfd53c179f3e06fac8acb0acca379bd32bd.webp)

![](images/5f59833cff57e73e69ea1ccb88ea4ec6c114b57e3f21a5d9c6c06531002523b2.webp)

![](images/29b8dd85a1d337c6d9dc1fa3e7524581dbc2301585fe5b24e3772f399d3227c4.webp)

![](images/ab088188eafda4c9caf79a4df855b43e98b2adc228e41de8d103a373cf1696a9.webp)

![](images/1e1984a1cef81a82f4580ab9f3a7beea62993364a2a8f96a7231c5fa293cf6db.webp)

![](images/d2e03837d1b053f9023c2b3eeacfeb64459f1d883b61ab511891253f53a536c7.webp)

4 Install in the reverse order of removal.


### Intake Air Outlet Hose (Turbo Charger) - Removal and Installation
Remove the radiator grille.

2. Loosen the clamp at both sides and remove the outlet hose.

3.Loosen the clamp on the intake air hose and remove the intake air hose.

Installation Notice

![](images/fd4f77b88ddc992a51a0668b684b215ccc68f9dfbc413c5fa958944545985fcb.webp)

Install in the reverse order of removal.


### Notice
Securely fasten the clamps on the pipes and hoses.


### Intake Air Inlet Duct (Air Cleaner) - Removal and Installation
1. Loosen the clamp at intercooler side.   
2 Loosen the clamp at turbo charger side.

![](images/0dd1634768d090ace55770184665af755d2e53ab600bf6b54ad0289419fd9169.webp)

3.Separate the hose from the oil separator and remove the intake duct. 4 Install in the reverse order of removal.


### Intake Air Inlet Duct (Intake Manifold) - Removal and Installation
1. Loosen the clamp on the inlet hose in intercooler.

![](images/1dd94eef57e35457cc99ad7525b302be8de6175328abe503da0df4a549f56b84.webp)

2. Loosen the clamp at the intake manifold and remove the inlet hose.

Installation Notice

![](images/4e49e08f65f85133ccee852dc6b50896b7d1559d2470dff27c15bf60b8293feb.webp)

3 Install n the reverse order of removal.

![](images/8ae67cb206c1873fcd87cfe5a1af7893501e02c7266e410526bd9708ca5e3f17.webp)


### INTERCOOLER
The turbo chargeris designed to improve the engine power by introducing more air (oxygen) into the engine. However, the intake ai is heated (100 \~ 110°) during the compression processin turbo charger compressor and the density is lowered.

The intercooler is the device which cools (50 \~ 60°C the air entering the engine. Colder air has more oxygen molecule: than warm air. Thus cooler air gives more power and better fuel economy.

![](images/5cba1edd6fa402d070768a7eaf80886c358d91aa02b86df20da0cd61375d81e6.webp)

1. Intercooler

![](images/597065e5b705751c4a26a8bf83b56a501f3ead85c85bbe89058823f5cbb50aae.webp)


### Intercooler - Removal and Installation
Remove the radiator grille.

![](images/e38a371c87227c253a927958ab9c711f67ef7e78082e8a3fcc67334606b519d6.webp)

2. Loosen the clamp at both sides (inlet and outlet) of the intercooler.


### Installation Notice
![](images/6a906243580c7501bd2d7c148958dd859e14252133e959647334c4e574b4a313.webp)

3Remove the intercooler mounting bolts. Installation Notice

![](images/223e6516afa47a1f94e742e34481ba7785c8dc2db9652cde3abf385f6c6fc550.webp)

![](images/278d26f9edf094fcba4b6b44a5cbc682d434751e2e51960a950e6af0c9e431fc.webp)

4.Remove the air duct in intake manifold and the intercooler assembly.

5 Install in the reverse order of removal.

![](images/ac161e74188586fcb117d24052c3a2118ef17cbfb185ad69d0bb13890f34e771.webp)


### INTAKE MANIFOLD ASSEMBLY
![](images/04ea9c8324727d67966b2768913153c658ad5cf9222b231c54bfe4c13c7076bc.webp)

Y220_03030


### System Characteristics
•Shape that delivers the required capacity of compressed air from turbo charger to inlet port   
•Optimized EGR gas mixture in inlet chamber   
•Maximized intake efficiency with helical and tangential inlet port -Improving the swirl ratio in low and mid operating range -Improving the acceleration/fuel economy and reducing the maintenance in low and mid operating range   
Integrated inlet port and coolant outlet port

![](images/ef40143ac1677d359bbeeea3cdd128d536b201387926e95d42a78751571b4a66.webp)


### SPECIAL TOOLS AND EQUIPMENT
![](images/498f20c6933431f5e818fce8fe98244732f6ab33a7b187c1c810236613784518.webp)

![](images/f61b625423ff25bd190eaedbe75952695651a0da5451912efaeebd9bbfb23b07.webp)

![](images/c7a9811d9aab201f28db633a955fb0a3d44cb659ac7ae0e3773354b2d5a736b4.webp)

![](images/b465ef91d01af14e3d5ddb55bcf2a0034486be95196928800f18c87bbf4f4478.webp)


### Intake Manifold - Removal/nstallation
Preceding Work: Disconnection of negative battery cable Lift up the vehicle and remove the skid plate.

![](images/27aaf3e1df42067ffbccf14b1039a23be7b90de3d8c469ea334e7f6596cba72d.webp)

2. Open the coolant reservoir cap and remove loosen the drain cock to drain the coolant.

3.Remove the air inlet hose (1) from intake manifold.   
4.Loosen the clamp and remove the coolant inlet hose (2).

Remove the coolant inlet port housing.   
6Remove the vacuum hose from EGR valve.   
7. Remove the EGR valve mounting bolts and gasket. Remove the EGR exhaust pipe (primary) mounting bolts and gasket.


### Notice
•Replace the pipes (2, 3) at both sides of EGR cooler (1) and gaskets with new ones.   
•Make sure that the convex surface of gasket is facing to the pressurized direction.

Remove the brackets and connectors from top section of the engine.

-Vacuum hose bracket in turbo charger   
-Booster pressure sensor   
-Main wiring bracket   
-Ground cable bracket   
-Fuel pressure sensor connector

9. Unscrew the bolts and remove the vacuum modulator bracket.

![](images/265621880be6549689cea98103536a06b2a83f1005e3452bb91df9102bf8f1ea.webp)

10Remove the HP pump fuel supply line bolts.

11. Remove the HP pump fuel supply line mounting bracket.

12. Remove the HP pump fuel return line at fuel filter.


### Notice
• Plug the openings of pipes and ports with sealing caps to keep the cleanness of the fuel system. • Replace the pipes with new one once removed.

13.Remove the injector return line at HP pump.


### Notice
•Be careful not to damage the pipes to HP pump. • Plug the fuel return port of the HP pump with a sealing cap.

![](images/93094dc661adfabf2653bed1e2e066b14125da444923ca6ad474a682679c72ba.webp)

![](images/a1f332cf175571a98e40da62734fb5506b3f6bbfaa105512b173e683f5726e2b.webp)

![](images/fcf4b4db9097f08c9457caded56b9c6837c157ac6fa6794143d75163e73369a0.webp)

![](images/62a5ae6fcc58a2d6a977cdef17fba700adcd5155fc4ef274f777f43de112deea.webp)

14.Remove the intake manifold mounting bolts.


### Notice
Check the length of the bolts before installation. M8 x 45: 6EA M8 x 130: 6EA

![](images/9113a0dbbc6c69014ea2ebfeffd7de89fbee99c7736f64390067de2faed4619e.webp)

15. Lift up the vehicle and remove the propeller shaft joint bolts.

16. Unscrew the bolt in oil filter and remove the intake manifold and gasket.


### Notice
•Replace the gasket with new one. • Make sure that the residual coolant in intake manifold gets into the inside of inlet port.

17. Instal n the reverse order of removal.


### Notice
•Replace the gasket with new one. • If replaced only gasket without any other service operation, completely remove the coolant and other contaminants from the engine before installation.

![](images/f0b8553e189d3105d1c58af73750b7b92f57e88c4ae3f87c8c6806340c94e897.webp)


### EXHAUST SYSTEM LAYOUT ... .. 43
Components locator DI04-3   
Exhaust gas flows . DI04-4   
Turbo charger assembly. DI04-6


### EGR VALVE AND VACUUM MODULATOR .. DMI04-27
EGR system. . DI04-27 EGR valve and turbo charger actuator control vacuum circuit . .DI04-28


### EXHAUSTSYSTEM AND .MUFLER . MI4-36
Muffler .. .DI04-36   
System overview . .DI04-37

![](images/ca2708aca29c9f55b69c23dfc25816686881b2045b27d00a50d558674e94547c.webp)


### COMPONENTS LOCATOR
![](images/a541d682fb8db79243708ff34effedca078f32ae8b42a134992546627b8f56e1.webp)

![](images/9a30a84acc364e89a01404e8997fc5f8b1f9e5dd922cedc81d5edd86f897902b.webp)


### EXHAUST GAS FLOWS
![](images/aed865a541e00c3bc351a99804707b4d38f4b21b450c18d49b3dc1ea78bd0b64.webp)

![](images/4e49f3be77e2f80cfbe60d26fe203a88b784c5191324221ae5eaa7558935f68f.webp)


### Exhaust Manifold Removal and Installation
Remove the two intake hoses from the turbo charger.

![](images/73449aec5c26e3060111cd271abdd915f73ec41790e28e3cb5b2680ba42d7cda.webp)

2. Remove the turbo charger assembly (refer to Turbo Charger section).

![](images/83d1f0164f2a832503c765d98ab822ed99b1ccc2d71c367a4701e01bd72238cd.webp)

3. Remove the #3 pipe of EGR valve from the exhaust manifold.


### Notice
The #3 pipe of EGR valve is exposed to the high temperature and pressure of exhaust gas. Replace the gasket and pipe with new ones. Otherwise, it may cause the leakage of exhaust gas.

![](images/8f0e618accbe56646883f3d4138065e0cf7a24debbceef402bc528e15b7ad6cb.webp)

![](images/ce2fde512cc324e5a7c6f828816e725287c9169af58ef1e193b827919a453ff2.webp)

4.Unscrew the nuts and remove the exhaust manifold and gasket.

![](images/fa09a0a4258000c09a57bee32734c8d84ce09afdaa18cf70a9c287dab15c522b.webp)


### Replace the gasket with new one.
5 Install in the reverse order of removal.

![](images/6f9e5370cab8d929128d7873475306713613981404cf84caa16d0c2aa89f6532.webp)

![](images/fd407ab6f9d7d18d340061af9be455c6e39d0e1ec9a97d8eaf7dc29a325f53c8.webp)


### TURBO CHARGER ASSEMBLY
The turbo charger is an air pump installd on the intake manifold. It enhances power and increases torque power of engine to increase the fuel consumption rate. The engine without turbo charger cannot get as much power output as it inducts air by the means of vacuum being generated from descending strokes of the piston. Therefore, by installing the turbo charger on the intake manifold, it supplies great amounts of air to the cylinder increasing the volume efficiency and, subsequently, enhances output power.

Also, as the engine's power enhances, it increases the torque power and improves the fuel consumption rate. The regular turbo charger operates by utilizing the pressure from the exhaust gas and the other, caled Super Charger, operates by utilizing power from the engine. When the turbo charger is installed, weight of the engine increases by 10 to 15 % whereas the output power increases by 35 to 45 %.

![](images/94629866bc671c84771215775e2224aed4fc76d0fc6111c966e1df9fcfc6b1a7.webp)

Y220_04007


### Operating Principle of Turbo Charger
![](images/17a9fe0a394efdb0c6cfcad5c7a5e2ebaec0bfff198f3a04467750f8814007b2.webp)

The turbo charger has one shaft where at each ends are installed with two turbines having different angles to connect one end of housing to the intake manifold and the other end to the exhaust manifold. As the turbine, at exhaust end, is rotated by exhaust gas pressure the impeller, at intake end, gets rotated to send air around center of the impeller, being circumferentially accelerated by the centrifugal force, into the diffuser.

The air, which has been introduced to the diffuser having a passage with big surface, transforms its speed energy into the pressure energy while being supplied to the cylinder improving the volume efficiency. Also, the exhaust efficiency improves as the exhaust turbine rotates. The turbo charger is often referred to as the exhaust turbine turbo charger.

Diffuser: With the meaning of spreading out it is a device that transforms fluid's speed energy into the pressure energy by enlarging the fluid's passage to slow down the flow.

![](images/b607508f7578305b4c76dd458d9d61bb9f67d2dc09ee1cc9db9baf373c169b67.webp)


### Construction of Turbo Charger
The turbine wheelin turbo charger and compressor wheel are installed at each side of the shaft. I is comprised with the shaft supporting center housing (supporting the compressor with two float journal bearings), the turbine side parts of Turbine Wheel, Shroud and Turbine Housing, and the compressor side parts of compressor wheel, back plate and compressor housing.

The turbine rotates turbine wheel by receiving exhaust gas energy from the engine.   
The compressor receives torque energy from the turbine and the compressor wheel inducts air t force it inside of the cylinder.

![](images/468bf2e7ddbcdb311d331d714f852c6c55d50dd39106225db1164cfa8c75b704.webp)

Y220_04009

1.Turbine housing   
2. Turbine wheel   
3. Compressor housing   
4. Compressor wheel   
5. Center housing   
6. Turbo charger booster pressure control valve   
7. Control link   
8. Bypass flap

A. Air inlet (from atmosphere)   
B. Exhaust gas inlet (from cylinder)   
D. Exhaust gas outlet (to atmosphere)   
E. Exhaust gas bypass passage   
Н. Oil supply opening   
J. Oil return line

![](images/fa94c3220b9a2f1464ea0e2acc7d7d541222c81102090a0a6c7db1caa353fc7b.webp)

![](images/f8ba3efeb7c5ca2c6db8f051578043ad2e6142703686ef8893c393724135b8f7.webp)


### Impeller
The impeller is wings (wheel) installed on the intake end and performs the role of pressurizing air into the cylinder.

The radial type has the impeller plate arranged in straight line at the center of shaft and, compared to the backward type, is being widely used as it is simple, easy to manufacture and appropriate for high speed rotation. As the impeller rotates in the housing with the diffuser installed in it, the air receives centrifugal force to be accelerated in the direction of housing's outer circumference and flows into the diffuser.

As surface of the passage increases, air flown into the diffuser transforms its speed energy into pressure energy and flows into the intake manifold where the pressurized air is supplied to cylinder each time the intake valve of cylinder opens up. Therefore, the efficiency of compressor is determined by the impeller and diffuser.


### Turbine
The turbine is wings installed at the exhaust end where, by the pressure of exhaust gas, i rotates the compressor and performs the role of transforming heat energy of exhaust gas into torque energy. The radial type is used as the turbine's wings. Therefore, during operation of the engine, the turbine receives temperature of exhaust gas and it rotates in high speed, it requires to have sufficient rigidity and heat resisting property.

During operation of the engine, exhaust gas discharged through the exhaust valve of each cylinder makes turbine rotate by coming in contact with the turbine's wings from the outer circumference within housing of the turbine and is exhausted through the exhaust manifold. At the same time, as the impeller is on the same shaft, it rotates.


### Floating Bearing
Floating Bearing is a bearing, which supports the turbine shaft that rotates at about 10,000 to 15,000rpm. I could be rotated freely between the housing and the shaft as it gets lubricated by oil being supplied from the engine.


### Notice
Stopping the engine immediately after driving at high speed stops oil from being supplied to the bearing and may cause it to get burnt. Therefore, the engine must be stopped after cooling the turbo system by sufficiently idling the engine.

![](images/897b87eaf93c15b0fb8562c2e6a4bb530f865b1f99b9acc4c9bd2c2eaf4fa277.webp)


### Booster Pressure Control Valve Unit (Turbo Charger Actuator)
In order to reduce discharging of hazardous exhaust gas and to avoid the engine's overrun the turbo charger must be appropriately controlled. The maximum turbo charging pressure must be controlled as excessive increase in the pressure and power output can cause critical damages to the engine. In order to control these, the booster pressure control valve is installed on the turbo charger.

The difference of the booster pressure control between the existing D engine and D engine isthatiD engine, booster pressure of the intake manifold operates the booster pressure control valve connected directly to the turbo charger whereas in Dl engine, the control is achieved by utilizing vacuum modulator (vacuum from a vacuum pump) designed to control the booster pressure control valve. It operates booster pressure control valve by supplying electrical power to the vacuum modulator having the amount of air being flown into the HFM sensor from the engine's ECU as the base signal.

Refer to the EGR section in following pages for the function ofturbo charger and HFM sensor in exhaust system.


### Booster pressure control valve unit and vacuum modulator
![](images/fa4e4970c4c6af011bb10de9b04c9d70890313e00e49e6cbd70d6fc53d8b9941.webp)

Y220_04012

![](images/29eb9bc514caf319a45b8aefae1b570edb1dc10b5793ce4b1aff5375e3024327.webp)


### Inspection of Turbo Charger
The following lists cautions to take during test drive and on the turbo charger vehicle, which must be considered during the operation;

1. It's important not to drastically increase the engine rpm starting the engine. It could make rotation at excessive speed even before the journal bearing is lubricated and when the turbo charger rotates in poor oil supply condition, it could cause damage of bearing seizure within few seconds.   
If the engine is running radically after replacing the engine oil or oil filter brings poor oil supply condition. To avoid this, it's necessary to start off after idling the engine for about 1 minute allowing oil to circulate to the turbo charger after the replacement.   
3When the engine is stopped abruptly after driving at high speed, the turbo charger continues to rotate in condition where the oil pressure is at '0'. In such condition, an oil film between the journal bearing and the housing shaft journal section gets broken and this causes abrasion of the journal bearing due to the rapid contact. The repeat of such condition significantly reduces life of the turbo charger. Therefore, the engine should be stopped possibly in the idle condition.


### Notice
After string for long period of time during winter season or in the low temperature condition where the fluidity of engine oil declines, the engine, before being started, should be cranked to circulate oil and must drive after checking the oil pressure is in normal condition by idling the engine for few minutes.

When problem occurs with the turbo charger, it could cause engine power decline, excessive discharge of exhaust gas, outbreak of abnormal noise and excessive consumption of oil.

1. Inspection when installed

-Check the bolts and nuts foe looseness or missing   
- Check the intake and exhaust manifold for looseness or damage   
- Check the oil supply pipe and drain pipe for damages   
-Check the housing for crack and deterioration

Inspection of turbine in turbo charger

Remove the exhaust pipe at the opening of the turbine and check, with a lamp, the existence of interference of housing and wheel, oil leakage and contamination (at blade edge) of foreign materials.

-Interference: In case where the oil leak sign exists, even the small traces of interferences on the turbine wheel mean, most of times, that abrasion has occurred on the journal bearing. Must inspect after overhauling the turbo charger.   
-  Oil Leakage: Followings are the reasons for oil leakage condition; •Problems in engine: In case where the oil is smeared on inner wall section of the exhaust gas opening. •Problems in turbo charger: In case where the oil is smeared on only at the exhaust gas outlet section.


### Notice
Idling for long period of time can cause oil leakage to the turbine side due to low pressure of exhaust gas and the rotation speed of turbine wheel. Please note this is not a turbo charger problem.

![](images/9b965f9651184e3bfd3677a5d0670e551b4dc950601f9b58aab497c0395ca5bc.webp)

- Oil Drain Pipe Defect

In case where oil flow from the turbo charger sensor housing to the crank case is not smooth would become the reason for leakage as oil builds up within the center housing. Also, oil thickens (sludge) at high temperature and becomes the indirect reason of wheel hub section. In such case, clogging and damage of the oil drain pipe and the pressure of blow-by gas within the crank case must be inspected.

- Damages from Foreign Materials When the foreign materials get into the system, it could induce inner damage as rotating balance of the turbo charger gets out of alignment.


### Must absolutely not operate the turbo charger with the compressor outlet and inlet opened as it could damage the turbo charger or be hazardous during inspection.
- Interference: In case where is trace of interference or smallest damage on the compressor wheel means, most of times, that abrasion has occurred on the journal bearing. Must inspect after the overhaul.

- Oil Leakage: The reason for oil leakage at the compressor section is the air cleaner, clogged by substances such as dust, causes the compressor inlet negative pressure;

A. Rotating in high speed at no-load for extended period of time can cause oil leakage to the compressor section as oil pressure within the center housing gets higher than pressure within the compressor housing. B. Overuse of engine break (especially in low gear) in down hill makes significantly low exhaust gas energy compared to the time where great amount of air is required during idling conditions of the engine. Therefore, amount of air in the compressor inlet increases but the turbo charge pressure is not high, which makes negative pressure at the compressor section causing the oil leakage within the center housing.


### Notice
No problem will occur with the turbo charger if above conditions are found in early stage but oil leaked over long period of time will solidify at each section causing to breakout secondary defects.

- Damages by foreign materials: In case where the compressor wheel is damaged by foreign materials requires having an overhaul. At this time, it's necessary to check whether the foreign materials have contaminated intake/exhaust manifold or inside of engine.

![](images/7df9fb284c21007d47d87d6d9687a7a5127448b79c766dd988a16c6c9a3f6c15.webp)


### Path of Turbo Charger Defect
The following tries to understand the defects that can occur with vehicle installed with the turbo charger and to manage the reasons of such defects.

1. In case where oil pan/oil pipe has been contaminated, oil filter is defected and where adhesive of gaskets has been contaminated into the oil line.

![](images/7e07c11bc3dff943cc645c416c51bcace77041ef63655d92f9b29c881d06dafd.webp)

![](images/aa38f4e71dd6243f662f25d91d78d4c3089d9ed48530f8ab7637530954364c5b.webp)

. Oil Pump Defect: Rapid over-loaded driving after replacing oil filter and oil and clogging of oil line.

![](images/169fc97e8ffa59f4ab9e7ab780f978a95b74f5f2a02cd310a9198240716a6921.webp)

![](images/69f4601e5195509e6f5d1c8f5c82ee377078cee1c31bb3066f87fe5e02ff1271.webp)


### 3. Turbine Side: Inflow of foreign materials from engine Compressor Side: such as air filter, muffler and nut
![](images/69bcd87b23f29dcbdae2a081c9816ddc293cce121451d41e2bd81e4f7afbe8f6.webp)

![](images/9eb15d104e6748e63d56bd0aba272b0f562dade33205e6fab13142525aa313f2.webp)

![](images/44ca2667aac06bf278d23e0edade6fa9704b198b5ab1d3157df2d0f17dae0085.webp)

![](images/8673d36cdda438962db1d39d553994699fb933ba90fb410f7ebff424ff01a5e9.webp)


### How to Diagnose
The followings are cautions to take in handling defects of turbo charger, which must be fully aware of;


### Cautions When Examining the Defects:
After stopping the engine, check whether the bolts on pipe connecting section are lose as well as the connecting condition of vacuum port and modulator, which is connected to the actuator.

During idling of the engine, check for leakage in the connecting section of pipe (hoses and pipes, duct connections, after the turbo charger) by applying soap water. The leakage condition in the engine block and turbine housing opening can be determined by the occurrence of abnormal noise of exhaust.

.By running the engine at idle speed, abnormal vibration and noise can be checked. Immediately stop the engine when abnormal vibration and noise is detected and make thorough inspection whether the turbo charger shaft wheel has any damages as well as checking the condition of connections between pipes.

.In case where the noise of engine is louder than usual, there is possility of dampness in the areas related with air cleaner and engine or engine block and turbo charger. And it could affect the smooth supply of engine oil and discharge. 5. Check for damp condition in exhaust gas when there is sign of thermal discoloration or discharge of carbon in connecting area of the duct.

When the engine rotates or in case where there is change in noise level, check for clogging of air cleaner or ai cleaner duct or if there is any significant amount of dust in the compressor housing.

7.During the inspection of center housing, inspect inside of the housing by removing the oil drain pipe to check for sludge generation and its attachment condition at shaft area or turbine side.

Inspect or replace the air cleaner when the compressor wheel is damaged by inflow of foreign materials

Inspect both side of the turbo charger wheel after removing inlet and outlet pipe of the turbo charger.

-Is the rotation smooth when the rotor is rotated by hand?   
-Is the movement of bearing normal?   
-Inspect whether there has been any signs of interference between two wheels.


### Notice
It's important not to drive the engine when the intake manifold hose has been removed.

![](images/51b5c639fa98edf800971f331eb01a29375c523764ca663dac8484c1b691d58c.webp)


### Diagnosis and Measure
![](images/b5bef5cbfa41ebb608b57df5b8204b7dd6c35fc2a8773593d9572d8cfe751387.webp)

![](images/20f4745ad50628196b8c539100e660b65c9cbf64ec862ed07b5db9b78fdf7d9c.webp)


### Before Diagnosis
The base of making diagnosis on the EGR related system is the inspection on the connections of the vacuum hoses in related system as the first priority. When abnormal condition occurs with the EGR system, the basic approach is, as described in prior sentence, making detail inspections of vacuum circuits of each system before connecting the scan tool or vacuum tester. I is necessary to manually check on the connections if there are any slacks orloose circuits even if the visual inspection shows vacuum hose as being connected. f there are not any problems then the next inspection area is the connections of the system connectors. Most problems with the occurence of system malfunction are from conditions of vacuum line and connector connections and the causes from the malfunction of mechanical mechanism is actually very few.

For example, when there are no problems with basic components, let's assume that there is a vehicle having vacuum leak from connection slack in the vacuum line between EGR vacuum modulator and EGR valve. This vehicle, due to the driving condition or, according to the circumstances, smog or other conditions, could create customer's complaint and by connecting the scanning device could display as the malfunction of the EGR valve's potentiometer.

As previously explained, this car has a separate controller to control the Hoover EGR and, in accordance with various input element, the controlle controls EGR valve by regulatig the force of vacuum being applied t the EGR valve through PWM control. At this time, the controlle has to receive feedback whether the EGR valve operates correctly according to the value sent t the EGR modulator and this role is performed by the EGR potentiometer located at top section of the EGR valve.

In other word, the controller sent correct output value to the EGR vacuum modulator but, due to the leakage of vacuum, signal of required value can not be received from the EGR potentiometer causing to display as malfunction of related parts.

As a reference, the EGR valve of diesel vehicle (DI Engine) controling from the engine ECU to EGR system has different shape than the Hoover EGR valve because the EGR valve's operation signal n the DI engine is performed by the HFM sensor instead of the EGR potentiometer.

This principle is that when the EGR valve opens up to flow exhaust gas into the intake unit the amount of fresh air, comparatively, wil be reduced. The DI engine ECU receives feedback signal of change in amount of air being passed through the HFM sensor according to the opening amount of the EGR valve.

![](images/04a5969d05428aa625565ffe207f4a3dfdeceb5bb66f41bc506fd2c868c7eebd.webp)  
Hoover EGR System for IDI Engine (Including the EGR Valve Potentiometer)   
EGR System for DI Engine

Y220_04013

![](images/10b03f03117430fbee77a87d5eb9d54b339a94d785353e6611a0ae908635f75f.webp)

The other big diffrence between the Hoover EGR and EGR controller for Dl engine is that from two vacuum modulator, one is same as being the modulator for EGR valve whereas the Hoover EGR system's the other modulator controls ALDA of injection pump and the DI engine's the other modulator controls waist gate ofthe turbo charger.

This difference is in accordance with the difference in fuel injection method where the IDI engine has mechanical njection system and Dl engine is capable of making electronically controlled fuel injection.

In other word, t reduce the amount of the fuel injection in no-load rapid acceleration mode, the IDl engine's Hoover EGR utilizes solenoid valve to disconnect the connection circuit between intake manifold and ALDA causing negative pressure to occur in the vacuum modulator to reduce the amount of fuel injection. When Dl engine, basing input signal from the related sensors such as acceleration pedal sensor and engine RPM, recognizes that current mode isthe no-load rapid acceleration mode it reduces the amount of fuel injection by sending short electrical signal to the injector.Therefore, disregarding the modulator for the EGR valve in DI engine, one must keep in mind that the other modulator is used to control the booster pressure valve in turbo charger.

![](images/77a9a4b787e24c1f454561c99708fd34f7aa4050d5237ca05ff712f429ffa0cf.webp)

![](images/3ee26763517dc231f041b300223d861aea7769473c6181398a92e77bb6f4b00b.webp)

![](images/d37ad4052c64c4bc2a9c9191563e98b65415c7dd009f4cab3142372364b7da3b.webp)

![](images/dd982b23a251ef469d1f9dd45a1ac7973a5af6b57b4855207e2d70c4e934872d.webp)

![](images/678f6861ef047674cd372bc523618cd4877d7bbc37da102bf2739809c6b99987.webp)

![](images/58532306a6234e15240e75f08a52d8844e830a546f59e062db7fc784df34cce9.webp)

![](images/4f9b32962ef78264b0db7c4c985d4e972008c4efa617437c74ff0315fa8a0abd.webp)

![](images/4ad902619c4fbbb7706cd57d26ea8f8d0ff801e7a7f8edce15eacc270ef016b4.webp)

![](images/0dcdf89837bcba1c5b8ab4a0fe9772d67f27fa6a95c1a630d38b30413e911083.webp)

![](images/94d85a4fe9ad105edb545300ef7c90b30e7b532107c5f1eb0550d86f9c48ae20.webp)  
For other diagnosis, refer to Diagnosis section.

![](images/6b3aa24994dd10469f5686e3eff44b4eb2530e3e4166e9f36b463dea924d4833.webp)


### Turbo Charger Assembly - Removal and Installation
Remove the drain plug and drain the engine oil from the oil pan.

Installation Notice

![](images/c939a49e8b65f0184046a2a318746081b2b3f6c6de3b8a66864690cbe8ad4528.webp)

Remove the vacuum hose and inlet hose from the turbo charger.

Installation Notice   
![](images/af6b58e2f93696f368cefebc900d361493346485bdbe01142eb28d06d41c9550.webp)

![](images/8b1d6390cab0d84dc79aa83042ceccc84bfc82f4574a0b33770c32fbb681e3f5.webp)

3. Remove the bolts and nuts at the exhaust manifold in turbo charger.


### Installation Notice
![](images/e155a159b5d3ecf2f7295bd75f23b1b1db0674cdd7d72bc52dbbe498674919a5.webp)

4.Remove the lower and upper bolts at turbo charger oil supply pipe.

Installation Notice

![](images/77d1232a3f305ca6f75bc93c740c6af9b66a7ab715201a24572e0f9e91e3f4eb.webp)

![](images/cf1f3097a156f942db61a7b95e410efdf9268785a3111db6b1852d21a26db79d.webp)

![](images/7964908c27aa1827e155f4abe97cc01a02c2777d0d3b420f522c8b44346016d6.webp)

![](images/371f277a4299fb37d83420820220dc035b684ccf107143205caec562acc3919c.webp)

![](images/ce8742312c5557816f5606fbe019d2565d81cb5ebf6815c4cc5199c397fb2f87.webp)

Remove the lower bolts at turbo charger oil return pipe.


### Notice
Replace the steel gasket with new one.

Installation Notice

![](images/320a848c707e946df8a39387a0dad5b2e8163f2c80761f9388dfff117b1959a0.webp)

![](images/a28f922e3b2b9e08c140a78e5c66a2d10158b1a1820c6e59ebde004c1ad21f23.webp)

Remove the lower bolt at turbo charger bracket.

7.Remove the turbo charger bracket bolts. Installation Notice

![](images/fed67c8663c1728adef447cf42ddee15b3631ec3396c4d27615426d583aa9627.webp)


### Notice
Use only 12 1/2" wrench.

Remove the bolts and nuts at the turbo charger and the exhaust manifold.

Installation Notice

![](images/2fff0e97558d55535e69999a4498c2d20ae302a641fb60a0455b871d01af6b44.webp)

Remove the turbo charger assembly.

10. Install in the reverse order of removal.


### Notice
•Replace the steel gasket with new one. •To prevent gas leaks, tighten the fasteners with the specified tightening torques.


### General Information
EGR system controls the opening vale of EGR valve by transmiting electrical signal (PWM control) from the engine ECU to vacuum modulator. Also, the engine ECU receives the feedback signals of the amount of air flowing through the HFM sensor.

![](images/729fee833873cc365bf7553010a8a6349d91becccc3f36ab541498d579598248.webp)

Y220_04023

1. EGR valve

2. Vacuum modulator

3. Vacuum pump

4. EGR center pipe (EGR cooler)   
5. Intake manifold   
6. Hfm sensor

![](images/17ff6565fa7de874bc7c7aa8fce540d8fae572679528a7a66f2fa5ed07a4e84e.webp)


### Vacuum Modulator
The biggest diference between the vacuum circuit and layout of the Hoover EGR system after K2004 has been introduced is the location of the vacuum modulator for EGR valve control and the function of the other modulator. In case of EGR equipped veicle (ID ngine), it performs the role of controlling the PLA of ijection pump whereas, in D engine, it controls the turbo charger actuator.


### DI engine vacuum modulator
1. EGR valve vacuum modulator   
2. Turbo charger booster vacuum modulator

![](images/6b4aa807773f58c27b2de8c24228dbc893564939697827c48a96308bb67b6489.webp)


### IDI engine vacuum modulator (hoover EGR system - K2004)
![](images/45efaf5ea456cb2cd07e9dcea3c20cd1f33b080f36a48a1c95cb32cf185cd508.webp)  
1. Vacuum modulator for EGR valve control

2. Vacuum modulator for injection pump PLA control

![](images/6082986f3b594a4dd5d984453c95f58ef551c419f9d1e0f3e8f0d4ea64771c47.webp)


### Vacuum Modulator and Vacuum Hose
Below figures illustrate vacuum hoses and related parts of EGR or turbo where wrong or poor connection of vacuum hose would display condition of engine irregularity and defect diagnostic codes on the scan tool.


### Related with EGR valve
![](images/c00d416754cc22e577d75037d3b80a2ef1844a3d6c353665f050263fd806c2fe.webp)

Y220_04026


### Related with turbo charger actuator
![](images/f35d17cec2607e421a00638a254a1f010d9c49d3923225b332d6867d397ebc98.webp)

Y220_04027

![](images/f5f5c1256addae7d92ea5ba20fa260659692242460ae06fcb99b65f618acd150.webp)


### EGR System Diagram
![](images/5a7eb53f8b5a8216f760cc881cf9bbe8ccc7ef35c79780274245d1c5ee8fa27b.webp)

Y220_04028


### EGR Valve
EGR valve recirculates some of exhaust gases to intake system to reduce toxic NOx from engine according to ECU signals.

• EGR valve opening point : -270 mmHg


### EGR Modulator
According to ECU signals, the vacuum modulator drives EGR valve by contrling vacuum pressure that is generated by vacuum pump with PWM type controls.

![](images/1f4194017efea05ed66e0f0e45baf6e215e8aab114a25702becad4eae5f0b557.webp)


### Operation Principle of Vacuum Modulator
![](images/7dfe87fc6100a7ad54d657ec45faa71e9b6e1f4e5681c8d7a452edfe563590b0.webp)

Vacuum is controlled according to relationship between chamber pressure (l in rolling nipple cover and magnetic force (l) in plunger.

According to ECU signals, the solenoid valve controls the vacuum pressure that is generated by vacuum pump (-900 ± 20 mbar) with PWM type control and drives the mechanical EGR valve and turbo charger.

![](images/a89c6da348c30f4f008533c1ecb40b0d1e60901ebb5aa3e469e00867a1e41f73.webp)


### Operating principle: Balance between original vacuum pressure and magnetic force (see above figure)
•Normal state (Fig. A): Original vacuum and seat section, 3 stoppers keep sealing   
•Duty up state (Fig. B): Original vacuum pressure is connected to inside of diaphragm chamber   
Duty down state (Fig. C): Increased diaphragm chamber pressure is connected to atmosphere to compensate the pressure.

![](images/4cda7e41bc689cb741dcf7f4d9eac94739d719a7c6f9b8299f1e3ad1bceb3769.webp)

> Operating principles when duty is applied from 0 to 50 %

Vacuum consumption: Compared to 50 % of duty, ON/OFF periods are most unstable and vacuum consumption is most high.

![](images/01935f2fd97fefb08d08aca9a4e9c4e0e24f69c933a0397a478eb1913791a07e.webp)


### Output Characteristics
![](images/c074ac8cf0bfca7634fa29e24eefbb34229d73b74d821db3850d924bab48e184.webp)

![](images/6ce8331abd63512d6aa697ba95932a20b2a64bca7c9983b9cec137ccbeaa4933.webp)


### Operating Conditions
Engine is running   
•Engine RPM is within a specified range. (EGR OFF under high RPM range)   
Engine torque is within a specified range. (EGR OFF under high torque range)   
•Vehicle speed is within a specified range. (EGR OFF under high speed range)   
Atmospheric pressure is within a specified range. (EGR OFF under high altitude and low atmospheric pressure) •Coolant temperature is within a specified range. (EGR OFF under high or low temperature)   
EGR OFF under extended period ofidling.


### Control Logic
•Main map: EGR volume is controlled based on intake air volume   
•Auxiliary map - Coolant temperature (Coolant temperature sensor) -Engine rpm (Crankshaft position sensor) Engine load (TPS): Detection of sharp acceleration - Intake air temperature (HFM): Decreases when over 60°C -Atmospheric pressure (Barometric sensor): Compensation of altitude

• Compensation value of auxiliary map willbe increased/decreased based on main map then ECU calculates EGF volume finall to regulate the vacuum duty that applies to the vacuum modulator to control EGR valve openings.


### Shut-off Conditions
Engine rpm: over 2,950 rpm   
•Vehicle speed: over 105 km/h   
• Coolant temperature: over 100°C or below 10°C   
•Idle period: over 50 seconds

![](images/c9820d0ae81cb4de4e133741457fc4acadf313949f549e8485089d83562ccce2.webp)

![](images/ee0c0dd728e54490954c311c4a97af20ec8ba9f791245a931ac523d30c213725.webp)


### EGR Valve and Pipe Removal and Installation
Remove the vacuum hose from the EGR valve.

![](images/abfdc7dc560a5fdabd606388992cbe4b4f7d3d14629ba712d02a16a602bd9dcb.webp)

Unscrew the bolts and remove the EGR valve (2), EGR valve #1 pipe (1) and gasket.

![](images/5e385ce553e2796a8a4cd08aa23f2f95319f783e11874bc3920441cd285b3698.webp)

3. Remove the EGR valve #1 pipe, #2 pipe, #3 pipe and gaskets from the engine.

![](images/caefd2999a8c41978a761c8b4d888000e691047e340eba7d4f86bf254cc08797.webp)

![](images/7c91fe18ccf6cb9d934cad95a4219bffd248b87ff38019e52678cb708094f9ac.webp)

![](images/7739f0f164303cd076436d75d962a4b1bf488e77931f8eb33e69803437cb7fa9.webp)

4 Install in the reverse order of removal.


### Notice
•Make sure to observe the specified tightening torques.   
•Never reuse the EGR #1 pipe (intake) and #3 pipe (exhaust) once removed.   
•Replace the gaskets with new ones.


### Vacuum Modulator - Removal and Installation
1. Remove the vacuum hose from the vacuum modulator.

Remove the vacuum modulator from the bracket.

![](images/c0d131e9eba1db2e4224d6531186b43e5a1fff73286f0dd7134e7f5229154f53.webp)

3 Install in the reverse order of removal.


### Notice
Make sure that the vacuum hoses are connected to correct locations.

![](images/3f76e0c20b0c3a6c3df63aa66302b1bbcfefce163045fdbeb5e26f57f4a4145f.webp)

![](images/e5b5ac22c9bb638e6af78151412e4ddb8d21aa7c55acb6ca2b44d2474720d1e6.webp)


### EXHAUST SYSTEM AND MUFFLER
![](images/48bec8351fb6b3a738553328277fc08b68cd5b881208b87785e2c13d9306f18c.webp)

Y220_04039


### MUFFLER
The mufler is located at the middle of the exhaust pipe and reduces the pulse noise and the tail pipe noise by eliminatig :he flowing resistance from the exhaust gas.

The important elements of the muffler are volume, construction and location.

![](images/19997ac7e155acc0a38edc4ebd15964de8814c73b9ad9e9f14f7435fa5069a02.webp)


### Exhaust System
Check the complete exhaust system and the nearby body areas and trunk lid for broken, damaged, missing or mispositioned parts, open seams, holes, loose connections, or other deterioration which could permit exhaust fumes to seep into the trunk may be an indication of a problem in one of these areas. Any defects should be corrected immediately.


### Notice
When you are inspecting or replacing exhaust system components, make sure there is adequate clearance from all points on the underbody to avoid possible overheating of the floor panel and possible damage to the passenger compartment insulation and trim materials.


### DOC (Diesel Oxidation Catalyst)
DOC (Diesel Oxidation Catalyst) is the purification device to reduce the toxic emissions from the exhaust gas from the engine. By using the chemical reaction, the amount of toxic gas such as NOx can be reduced.


### Notice
To prevent damage of DOC, never contact the lift pad when lifting up the vehicle.


### Muffler
Aside from the exhaust manifold connection, the exhaust system uses a flange and seal joint design rather than a slip joint coupling design with clamp and U-bolts. If hole, open seams, or any deterioration is discovered upon inspection of the front muffler and pipe assembly, the complete assembly should be replace, the complete assembly should be replaced. The same procedure is applicable to the rear muffler assembly. Heat shields for the front and rear muffler assembly and catalytic converter protect the vehicle and the environment from the high temperatures that the exhaust system develops.


### Heat Shield
The heat shield protects the vehicle and components from the high heat generated from the exhaust system.

In this vehicle, the heat shield to block the heat from DOC is installed to the underbody, and the heat shield to block the heat from the rear muffler is installed to the underbody between the fuel tank and the rear muffler.


### Hanger
The hanger is to support the components.

If the ganger is not properly installed, it may cause the vibration that is very difficult to diagnose. Therefore, install the hanger to the correct location so that the exhaust system cannot contact to the underbody and other components.

![](images/12ed49668614230542fe4f5d192ee44a539b3c7e8a9aad8ea56cc6b5733ff272.webp)


### System and principle
Oxidation catalytic technology for diesel engine is basically the same with it of gasoline engine used before development of 3 primary catalyst (2 primary catalyst), and its effect and performance were already proved.

DOC (Diesel Oxidation Catalyst) reduces HO and CO contained exhaust gas over 80 %, and removes SOF (Soluble Organic Fraction) over 50 \~ 80 %, but because its portion in total PM is low, it reduces approx, 20 \~ 40 % of TPM (Total Particulate Material).

Because of low reducing rate for PM of DOC, in order to guarantee safety rate of PM regulation, this technology is being used mainly. And it should keep over 80% of PM reducing rate, and at present it plays a role as a transition stage.

And also it reduces diesel odor and black smoke, platinum or palladium are being used as a catalyst.

On the other hand, it is a problem that it makes the reaction of oxidation, which SO2 produce SO3 and H2 SO4 by reacting to oxygen in exhaust gas, if temperature of exhaust gas becomes over 300°C, and this produced gas is very harmful to human body. To prevent is, previously it is requested that the sulfur content rate of fuel should be below 0.05 %, and in the future it is being expected to keep it below 0.01 %.


### Catalytic converter structure
The Catalytic converter of monolith type consists of 2 walled metal bodies which is made of Cordierite.

The principal element of converter consists of the materials like Alumina or oxidized Serume in order to apply to Ceramic Monolith. Washer coat operates first, and catalytic metal elements (Pt, Pd, Ph) operates to washer coat next.

Monolith type is lighter than other types, easy to manufacture and quickly approaches to proper temperature.

Washer coat is used to make a contact surface with exhaust gas bigger by adhering closely to small holes of inner layer.

If a lead compound or phosphorus adheres to the surface and the temperature rises, its surface is decreased.

The total area of general monolith converter is about 45,000 \~ 500,000 ft3. (10 times of a football field)

Generally Alumina (AL2O3) is used as a raw material and its 7 phases of gamma, delta, theta have big areas and high stability for the temperature, and nowadays gamma Alumina is used usually.

![](images/05658c7466dcc56703aaf0e7facd4be302b372929a6fb78a2b4c8f39c8809659.webp)

![](images/179f879262b64ef613ef8c1b137d9d015017067f81921e4c1e447b2f60643cec.webp)


### Catalytic converter and temperature
Catalytic converter has the normal function of purification at a range of the temperature. Because it has a weak point of decreasing of the purification rate in the condition of continuous high temperature, it should keep the temperature range of 400 to 500°C for normal condition. HC purification rate becomes better according to the increase of temperature in the normal range of temperature. CO purification rate becomes the best near the temperature of 450°C, and NOx does so near the temperature of 400 to 500°C.


### Purification of catalytic converter
•Adhesion of soluble organic fraction (SOF) below 180°C   
Purification of soluble organic fraction (SOF) over 180°C Chemical reaction formula   
•SOF(HC) + 02 .02+ H20   
•2C0+ 02. .2C02   
2C2H6 +702. .4CO2+ 6H20

![](images/08f30ee524bac08561219291c4977626b1be9b0eb8ec5b0e4d2227f7368eb4e2.webp)

![](images/7bab70b91543681e4d8b579228c3f03e2996641a2172ccf83bfcf3a6c5d78c67.webp)

Y220_04042

•Oxygen adheres to catalytic material : below 180°C

![](images/e13673ff1eb0ba3c0c819d0a051d6068fba9849bf1c9980d989ecb70f004bae0.webp)

Y220_04043

![](images/ce1ed1caf09a992b9d00a8528b311ae59a88b07c2fec2d2c00e5abc0b39da338.webp)

![](images/e81953582709e0a8f7cb8b34a9598b622c31438565149efa8ff631379194242b.webp)

C2H2n+2 .PAH (Aromatic HC) Soot Soot Metals SO2+H20 Metals SO2+H20 Catalyzer CO + 1/2 O2 CO2 HC + O2 CO2 + H20 PAH + O2 CO2+ H20 Aldehydes + 02 CO2+ H20 Y220_04045 • Catalytic material supplies each CO and HC with O2 for their oxidation : above 180°C

• Catalytic material conversion process by DOC


### Method for reduction of NOx
NOx is generated a great deal in case that combustion temperature and excess air factor are high. EGR valve can decrease NOx (30 to 35 % decrease) by making temperature of combustion chamber fall by means of exhaust gas recirculation.

![](images/08552229e198e8ed6c9c9aa1de8c260836cb41e7cd46838e63708ee4758cb77e.webp)


### Notice
Use the universal type wrench.

![](images/b4524ed86fbff1107870b380510bee39c74007df9db9352d4e24a2592c8b36f7.webp)

Remove the lower bolts and gasket.

![](images/83252dfae5f2a2ec8cb13ab2c87a499f25420ccae746e821cdab9f3e62342c48.webp)

Remove the pipe mounting rubber.

![](images/0872ad5c225e28202929cb706bafd891045c23eb24eb5c7f921006cad4d52efe.webp)

4.Remove the #1 exhaust pipe.   
5 Install in the reverse order of removal.

![](images/6d4119476e578fb50c6008397b95989ce9cbc8dac033f18c434e7447e1dd76d2.webp)

![](images/b31d78ae1c41d8d67fc342d7052424dee744a4c00c2932815af72f7a7eb25931.webp)


### Catalytic Converter Removal and Installation
Unscrew the bolts at both sides and remove the gasket and the converter. Install in the reverse order of removal.

![](images/ee95eb51f08b86f80bb5652cf41c23fb5c90a283b9817c7ac8ff66e1af8c32fd.webp)


### #2 Exhaust Pipe Removal and Installation
Unscrew the bolts and remove the gasket.

![](images/c2b33f62c972c63a01d2ee3d24fd5cfcfbda7effc8fdd61d0ecc8a17fa5557ca.webp)

Release the rear mounting lever with a screwdriver.

![](images/da4f166b91da4a026c9d503bd8fe628f121dcf056c8236b28375e1cfd97d2293.webp)

Remove the #2 exhaust pipe.

![](images/9d1341c262b477336d99b6aea7c440540dabe105545f8e61681f628c4184210b.webp)

4Install in the reverse order of removal.


### LUBRICATION SYSTEM. .. ... 0-3
Lubrication system layout . DI05-4   
Lubrication diagram . DI05-5   
Specifications . DI05-6   
Engine oil change DI05-10   
Oil pump . DI05-14   
Oil spray nozzle . DI05-16   
Oil pan assembly DI05-17

TROUBLE DIAGNOSIS ... ... I18

SPECIAL TOOLS AND EQUIPMENT . . 5.19

![](images/3742e3b4aca8c6770b097894ac473c304d00462bce85fdee33bb856c01d7a1b5.webp)


### LUBRICATION SYSTEM
![](images/fd6144d57d8fd25b47297498736c3d446d35d61a4ca95bb48ea9da4d1b77412b.webp)

![](images/efd95c59f468a2c5d618fe894cce2b7223520c43504851a4c268efd5e6294c16.webp)


### LUBRICATION SYSTEM LAYOUT
![](images/fa7a4f6551b4011c06f9ea3782e2cb5b7aaaffcf993491653996302d455c9d25.webp)

Y220_05002

![](images/1c9a3870e9c857ff9e453ab59f40c88a5ddb95914edc77a7950fc491263b139c.webp)


### LUBRICATION DIAGRAM
![](images/ac577ba71a798d0f963dbcd6aa2dd8b2cbfb4b95f5df31c87cb9d1037b78d876.webp)

Y220_05003

1. Opening pressure of by-pass valve in oil filter: 3 ± 0.4 bar

To prevent instant oil shortage after stopping the engine, the return check valve is installed in oil supply line of cylinder head.

![](images/f1fbbbd087837cf4ec48b4e4be22ffde6ac91dbce59599bab7b5b0b0f5ac434a.webp)


### SPECIFICATIONS
![](images/3b8722e8d89889c69b12c9677d14868e21be8e894355ff3ffc569701cadba066.webp)


### Severe condition:
-When most trips include extended idling and/or frequent low-speed operation as in stop-and-go traffic. -When most trips are lessthan 6 km (Operating when outside temperatures remain below freezing and when most trips are less than 16 km)   
-When operating in dusty, sandy and salty areas   
- In hilly or moutainous terrain   
-When doing frequent trailer towing

![](images/074d89a01432d818188d8f83fb4e5d83d75cd296e6f47a2ca2df379c77311b33.webp)


### Oil Pressure Switch
• Operating temperature: -40 \~ 140°C • Operating pressure: 0.3 \~ 0.55 bar •Permissible pressure: 10 bar

![](images/fc32662436819aa5e73f9dfe27c0829422c2a9d46669f79de6a49d209313605e.webp)


### Oil Pump
![](images/d353f0adddeaee13000ca46a0c65e729626d2fb8fb5c69a6123d19df719be7fe.webp)

![](images/d33cd2b8d3a7a31dc221f624e7b9761a96ed2e6e1c69a40db6019cf5d9a9d6ed.webp)

Differences between D27DT and old model (D29ST) - Enlarged pump capacity: Width of tooth (pump gear): 33 mm (D29ST: 30 mm) -Increased number of teeth (sprocket): 26 (D29ST: 24)


### Oil Cooler
![](images/90ebd4b130c0b835b3aa970110e9bd7ea3afa62d2dd7c7d36d0b7025b023b1eb.webp)

•Replace two oil cooler gaskets with new ones when the oil cooler has been removed.

![](images/039dee6b26aed205a94943b60ab35b81ef04c288a828355fa67d3a6a9fffcf9e.webp)

![](images/f70f30163ca03ce08c0c65a5372aa580603087052a113b44b2c489a53d1f77b5.webp)


### Blow-by Gas Reduction Device
![](images/37d180c6d283a8bf1f141316c790f4ae52107ea6211e1d17b4d2f7cdf7a13946.webp)


### Cylinder Head Cover
![](images/59392498a16edd98f32d3f6ef990354750ee533a7c124d2a39e71ce5f08b6c7e.webp)

Bafleplate assembly: The bafle plates in cylinder head cover separates oil and gas from blow-by gas, and controls the blow-by gas speed to send only gas to separator.

![](images/54606e97579f7ee743de662d86874a2d06a2ede7f0fd5bee0b5d902349763845.webp)


### Oil Separator
![](images/ba05ca503a139174692c94970192bbef4d103c0d4c4baeabf3145a444ae55282.webp)

Y220_05009

The first separation wil happen when blow-by gas passes through bafle plates in cylinder head cover; then oil and gas will be separated due to cyclone effect after entering the oil separator inet port. Separated oil returns to oil pan via oil drain port and the gas wilbe burnt again after entering the combustion chamber through air duct hose via PCV valve that opens/closes due to pressure differences between the intake side and crankcase.


### Engine Oil Pressure Check
Check the oil level and quality before checking the oil pressure.

Drain the engine oil.

Disconnect the oil pressure switch connector and remove the switch.

. Install the oil pressure gauge into the switch hole. Start the engine and let it run until the coolant temperature reaches at normal operating temperature (80 \~ 90°C).

Raise the engine speed by 2000 rpm and measure the engine oil pressure.

![](images/9e1313de15ca998c6d5955ac13846319583e3ae4a824f1ba6c420622f08b2230.webp)

Install the switch and engage the connector.


### •Apply the Loctite onto the thread of the switch and check for oil leaks.
![](images/0bd458c58556a4686e1ab4c4ab92fc288cc9f28d98e53329ea0a9e312236e308.webp)

![](images/2c2b203b22c22cfd4e961fd2703c6a816a1e01b96e6ac87fb9b0e91dd159d544.webp)


### ENGINE OIL CHANGE
Change interval: Initial change: 5,000 km, Change every 10,000 km or 12 months

Frequently check and add if needed. Shorten the change interval under severe conditions.

\* Severe condition:   
- When most trips include extended idling and/or frequent low-speed operation as in stop-and-go trafic. - When most trips are less than 6 km (Operating when outside temperatures remain below freezing and when most trips are less than 16 km)   
- When operating in dusty, sandy and salty areas   
- In hilly or moutainous terrain   
- When doing frequent trailer towing


### Water separation from the fuel filter should be performed when changing the engine oil.
![](images/521f955aeb4260231fd6fd3f4d4dd7971dad86a46fc23c1d29e610412a9739ea.webp)


### Engine Oil Changing Procedures
1. Park the vehicle on the level ground and warm up the engine until it reaches normal operating temperature. Stop the engine and wait around 5 minutes. Remove the oil filler cap, oil filter and oil drain plug to drain the oil.


### After driving, the engine oil temperature may be high enough to burn you. Wait until the oil is cooled down.
3Install new oil filter and tighten the drain plug with specified tighten torque.

![](images/87e8ab949544d61ef0a07c5657ceb24544966f93f768c3fead9a8890699bd039.webp)


### Notice
•Over-tightening may cause oil leaks.   
•Replace the drain plug washer with new one.

Fil te engine oil through the oil filer opening.


### Notice
The oil should not go above the upper mark on the dipstick. This would lead, for example, to increased oil consumption, fouling of the spark plugs and excessive formation of carbon residue.

Close the oil filler cap and start the engine.   
Stop the engine again and check the oil level. Add the engine oil i needed and check for the oil leaks.

![](images/8d488bc8459e8b14ed813db6fa9584a7b1d9390a65239d2fe7487a5c43471c27.webp)


### Engine oil filter change
1. For changing procedures, refer to the “Lubrication System” section in this manual.

• Lubricate the engine oil gasket with engine oil before installation.   
•Tighten it with the specified tightening torque.

![](images/dc87db5193445f6e3228b7d03b5bdd566e19867d000fa4050da7392552eaf917.webp)

![](images/80ce8bbc405c8c0545c63ef48cb527a0e012a45db192374d1ba8f6a30fcfd51b.webp)

Y220_05011

![](images/a3bfac9b4720c556210a860e837fbc4c33448d96a9c2629d8654ff48cee83fb2.webp)

![](images/075e792f3ebf5d3246ea45af9198d4fb8389e810f42a0d656ae06fa418d1a35a.webp)

![](images/a80bd6dd94d6336615ea9e41c7727fa6811fb52885ee4a284c179f48c31f40c8.webp)


### Oil Filter and Cooler Removal and Installation
Preceding Works:

-Draining of engine oil -Removal of EGR vacuum modulator bracket

.Remove the oil cooler hoses (supply and return lines).

Disconnect the ground cable from the oil pressure switch.

Remove the oil cooler and filter mounting bolt.


### Pay attention to the length of bolts.
![](images/73b5b29b3ecb96cd4e55005c6ed58109ef4245cada122f70147ccb8ce78b2176.webp)

4Remove the oil cooler and filter assembly from the cylinder block.


### Notice
The oil cooler and filter assembly cannot be replaced separately.

5 Install in the reverse order of removal.

![](images/cd6bd7f216e603860800f8506174a663685ec99197d39fd545920c0d9a1d922f.webp)

![](images/053c1fc0e14ebac0ba7d7f3897131550d9852f303a8614fd74987f607c0c02a0.webp)


### OIL PUMP
![](images/7f63368c02d4afa88c03e0f22d37209a5611542c9466450a69c995dc1fbfaa68.webp)

1. Oil pump   
2. Plunger   
3. Compression spring   
4. Guide pin   
5. Screw plug 50 Nm   
6. Combination bolt . 23 ± 2.3 Nm   
7. Oil strainer

![](images/0ad480bb15077466609718184c5ecc375f09700f6a6ea4cc6ff12f167142be87.webp)


### Oil Pump - Removal and Installation
Remove the oil pan.

![](images/d55a7c457c95ee785fd8e5bbb1ed94963c57812159b2a138dedd5a0a0140499e.webp)

Remove the oil pump.   
3Remove the screw plugs and the relief valve.   
4 Install in the reverse order of removal.   
5. Start the engine and check for oil leaks.

![](images/b23caa5c28f7e68189baa4d0def3eaf32debac17413aff3b027a2d055f28c29b.webp)


### Oil Dipstick Guide Tube Removal and Installation
Pull out the engine oil dipstick.

Remove the EGR valve pipe (No.3).

![](images/d003df32401c5f87f1fcd3aeaf3725d94925546637fb6af8539d5d3ac0af87fc.webp)


### Replace the pipe with new one.
![](images/fa21c4655b7abd490bd66138bb08f2c37e294dda3d80b4e4a894892ebe9f2159.webp)

Unscrew the bolt and remove the oil dipstick guide tube.


### Replace the O-ring with new one.
4 Install in the reverse order of removal.

![](images/3ef02304cd11c58cc183635ffefa5b8e8423d0ea062ea8e97fe95718191cdb20.webp)


### Notice
After installation, check for oil leaks.

![](images/99091a806062b9c6aebc3e8b1988a15e58c038959dfd7ddecfc328f5cab6f6e7.webp)


### OIL SPRAY NOZZLE
![](images/baffd58b3a601c970cdd214250557c1be66335b5be38c597189e8e2ac9a140e2.webp)

Y220_05021

1. Fitting sleeve   
2. Oil spray nozzle

3. Combination bolt . .10 Nm

4. Oil duct

![](images/d3b815b3a0f0396c991636c90eb6b6659b8dc5f9856c5d25ad782a7e710f28c0.webp)


### Disassembly
1. Remove the oil pan or crankshaft.   
2. Unscrew the bolts and remove the nozzle.

![](images/ebb4c16aea9a3b9231476b5f172b2045486372b0216789b1ea2c8169db519746.webp)


### OIL PAN ASSEMBLY
![](images/56678c4c66265bb294004d2cb3f1f3918ab78f089743faad9da546daf5de71a0.webp)

Y220_05023

1. Oil pump   
9. Oil pump cover   
10. Bolt   
32. Drain plug   
33. Drain plug . .25 ± 2.5 Nm(replace the washer)   
35. Spring pin   
36. Oil pump drive shaft   
37. Oil pump driven shaft   
38. Oil pump relief valve piston   
39. Spring   
40. Oil pump relief valve pin   
41. Oil pump relief valve plug   
44. Bolt .. .10 Nm   
45. Washer   
46. Bolt   
49. Oil pump roller chain   
50. Oil pump chain lock link   
51. Oil pump chain tensioner   
52. Oil pump chain spring   
53. Bush   
56. Oil pump sprocket   
57. Bolt   
58. Dust cover   
59. Cylindrical pin

![](images/3c18d2b5ff769cbff959e5ab6f2b40f7e821919582d89ce91a8ebe4bd8ff69ae.webp)

![](images/9f8f81553fe4807be640095312a9c8936226d6874379625cf8d42cea01583d93.webp)

![](images/7ecad4a0443d112cc94cc58cdda311cd4c1ab460c98884ecb054c81d18bf17e3.webp)

![](images/9029c217e14e492f6e603ea52c7c2baedebf8215cedd5671f7fc66425cf1cae4.webp)


### SPECIAL TOOLS AND EQUIPMENT
![](images/7b1f1c2f94723bdcebf17e79432782c8e2a1648ab9ab6f537a83f031f32bc146.webp)

![](images/8e84d967651dfaf8375eb6aa973cd99e5d9cab9eb5066e17ab8eaaa8112265f4.webp)

![](images/7adbf6cc858f12cd93fd1728f34ac71c22b3dc8e1afc0d7f7140bff3744fd997.webp)


### Table of Contents
COOLING SYSTEM .DI06-3   
ENGINE COOLING SYSTEM. .DI06-4   
Specifications . DI06-10   
INSPECTION AND REPAIR DI06-14   
Inspection . DI06-14   
REMOVAL AND INSTALLATION DI06-16   
PREHEATING SYSTEM .DI06-29   
Overview DI06-30   
Preheating relay DI06-30   
Preheating system diagram .. DI06-31

![](images/040c11a09427eda2c4bbe3bc45deddc12513df5d91f558cec0280684e1a89e4d.webp)

![](images/4c1f166eb28373d1a6cd5a77417910ec97694ab7f29a00d5b965033fa383c5e9.webp)

FFH (Fuel Fired Heater): refer to “FFH System” in this manual.

![](images/4506e7c3c2128979f11f6b6e632430ec5f1a491d4694ef231bb3a16972a1b65a.webp)


### ENGINE COOLING SYSTEM
![](images/6a24e061d96bc39093da0703cf466d64036d02f280d584b3d24a75cda0083eb4.webp)

Y220_06002

Cylinder block side Block #5 → Oil cooler → Heater → Heater water pump inlet pipe → Water pump   
Cylinder head side Cylinder head → Coolant outlet port (intake #1) → Radiator → Water pump

![](images/b8fec26e5201f557b92dfce33d55517f5f434dd72429ca0da3a4b8e792695327.webp)


### Function Description
![](images/fb62d6569ac6cf2d65fa8d93f36fd048290ca74813566a3946abeaf2f61a8f7d.webp)

•Cylinder head coolant outlet port is integrated into intake manifold. (in front of cylinder #1) Improved shape and gasket material to prevent coolant from leaking

![](images/06f7e8a9feef88d388fc2be67984aeb75e64daa6f08245c7e27ac6ff74a2ac58.webp)

Y220_06004

I OM 600 engine, coolant iflows through the heaterline rear section (cylinder#4 and #of cylinder head. However, in D27DT engine, coolant inflows from cylinder block through oil cooler (refer to coolant flows layout in previous page).

It prevents cooling efficiency from decreasing due to coolant separation between cylinder #4 and #5.

•In OM 600 engine, the coling fan is installed with water pump, however, in case of D27DT engine, t is connected to water pump with an additional pulley.

![](images/1e7b5da750494dc348dca44190f00fcde4e3fb53a67938ee601450740bd1d345.webp)

![](images/d5430eac81ad8d2bd00d58485f067d7881ddf03e4737037668865abb5fff6c90.webp)


### Radiator
This vehicle has a lightweight tube-and-fin aluminum radiator.   
Be careful not to damage the radiator core when servicing.

![](images/b3eb7522a0009e48458655868d5099eb7d478630b5ef84f40ca5bd334e53b4a9.webp)


### Water pump
The belt-driven centrifugal water pump consists of an impeller, a drive shaft, and a belt pulley. The impeller is supported by a completely sealed bearing.

The water pump is serviced as an assembly and, therefore, cannot be disassembled.


### Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the engine and radiator are hot.
The coolant reservoir is a transparent plastic reservoir, similar to the windshield washer reservoir. The coolant reservoir is connected to the radiator by a hose and to the engine cooling system by another hose. As the vehicle is driven, the engine coolant heats and expands. The portion of the engine coolant displaced by this expansion flows from the radiator and the engine into the coolant reservoir. The air trapped in the radiator and the engine is degassed into the coolant reservoir.

When the engine stops, the engine coolant cools and contracts. The displaced engine coolant is then drawn back into the radiator and the engine. This keeps the radiator filled with the coolant to the desired level at all times and increases the cooling efficiency. Maintain the coolant level between the MIN and MAX marks on the coolant reservoir when the system is cold.

![](images/3e6116e0f5adda9a167f5974f3ed64c1de4f3c2ac46473b3c6987bd36bb98643.webp)


### Thermostat
A wax pellet-type thermostat controls the flow of the engine coolant through the engine cooling system. The thermostat is mounted in the thermostat housing to the front of the cylinder head. The thermostat stops the flow of the engine coolant from the engine to the radiator to provide faster warm-up, and to regulate the coolant temperature. The thermostat remains closed while the engine coolant is cold, preventing circulation of the engine coolant through the radiator. At this point, the engine coolant is allowed to circulate only throughout the heater core to warm it quickly and evenly. As the engine warms, the thermostat opens. This allows the engine coolant to flow through the radiator where the heat is dissipated. This opening and closing of the thermostat permits enough engine coolant to enter the radiator to keep the engine within proper engine temperature operating limits. The wax pellet in the thermostat is hermetically sealed in a metal case. The wax element of the thermostat expands when it is heated and contracts when it is cooled. As the vehicle is driven and the engine warms, the engine coolant temperature increases. When the engine coolant reaches a specified temperature, the wax pellet element in the thermostat expands and exerts pressure against the metal case, forcing the valve open. This allows the engine coolant to flow through the engine cooling system and cool the engine. As the wax pellet cools, the contraction allows a spring to close the valve.

The thermostat begins to open at 85°C and is fully open at 100°C. The thermostat closes at 85°C.

![](images/e4d4a22839631a8bbcbf339b816ccdd5820e3b410cff83fdcf470456b7fcaae4.webp)

![](images/8f03c42538d6bc8501a9cdc92fb37edb62fbf7988521469c2a01395467a30e75.webp)

![](images/1ccb972969af2cdb0057e5a236a694f0c7aa0f6c57d9e92ed8a984e1c2af826d.webp)


### When closed (up to 85°C)
![](images/bf66a5bf2353a8fa793c2eb64c31d8c928d6f023c38151b72cc1bc11066b8fa6.webp)

X. from vrankcase

Y. to crankcase

Z. from radiator


### When fully opened (above 100°C)
If the cooling system is fully filled with, the coolant is automatically bled through ball valve (arrow) in thermostat.


### When partially opened (85°C \~ 100°C)
![](images/49a67595bd36c55416b6b9d2696adb3091138d53d7d6ec793f819166e2c2023d.webp)

Y220_06010

![](images/8062ae80f412d560dd279036c57aa60f6454a16e819c92c80344b0154e832845.webp)

![](images/339364ee1b6ef7b31795b024c3288916210d9223858f72cf6683076518aa6b76.webp)

![](images/24727c1c40375a1b8f56f6dc8fa0ebc0dee2b216fa90718181bc042296ac7723.webp)


### Viscous fan clutch
![](images/6396dfb3ff2cf1d460e3f054ef31a5862e91531af8dbda06702d24cf3b1eb1c6.webp)

Y220_06013

1. Clutch housing 9. Pin   
2. Drive disc 10. Bi-metal   
3. Flange 11. Bracket cover   
4. Seal ring 12. Separator disc   
5. Needle bearing 13. Supply port   
6. Cooling fan 14. Lever valve   
7. Oil scraper 15. Oil chamber   
8. Spring 16. Operating chamber

The cooling speed increases approx. 1,000 rpm with wind noise when the engine speed is 4,000 to 4,500 rpm and the coolant temperature is 90 to 95°C.


### Notice
Keep hands, tools, and clothing away from the engine cooling fans to help prevent personal injury. This fan is electric and can turn on even when the engine is not running.


### Notice
If a fan blade is bent or damaged in any way, no attempt should be made to repair or reuse the damaged part. A bent or damaged fan assembly should always be replaced with a new one to prevent possible injury.

![](images/75cf43fc2199b24c46431d199c6a6b1451e70fc5e0cb3bb52c40b4b43b86f518.webp)

The cooling fans are mounted behind the radiator in the engine compartment. The electric cooling fans increase the flow of air across the radiator fins and across the condenser on air conditioner. The fan is 320 mm in diameter with five blades to aid the airflow through the radiator and the condenser. An electric motor attached to the radiator support drives the fan.

1. A/C Off or Non-AC Model •The cooling fan operates at low speed when the coolant temperature reaches 95°C and at high speed when the coolant temperature reaches 100°C. • The cooling fan is turned from high speed to low speed at 97°C and turns off at 90°C.


### 2. A/C On
• The ECU will turn the cooling fan on at high speed when the A/C system is on.


### Engine coolant temperature sensor
The Engine Coolant Temperature (ECT) sensor uses a temperature to control the signal voltage to the Engine Control Unit (ECU).

![](images/63e8d4f7ccc247fd1493f759a9afd9c9cf4d82f0cc3d75dca25df02d1c2604e2.webp)

![](images/cb9b8e5e0a5f864697d4aba3957e6e2bf993d9fd13ede714476dc383c9a6958a.webp)


### SPECIFICATIONS
![](images/f92e2e88a92d302cbf1237011a5b3b22ee7157f19365bb81a43b993e83489c63.webp)

![](images/51f290ddaca39167e539e0225f7240f45d050ef85e46fd1a0c047faba03d62e4.webp)


### Notice
Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the engine and radiator are hot.

Take precautions to prevent antifreeze coming in contact with the skin, eyes or vehicle body. If contact happens, rinse affected areas immediately with plenty of water.

1. Place the vehicle on a level ground and check the coolant level through the coolant reservoir.   
.Add if needed. Change the coolant if necessary.

![](images/4e0bc9f239b08919234cea9d5672a588c5b8d3d1894085dc4613dd977c529dae.webp)

![](images/00c4b95f8cf8e5e740e9981cff6144cd1bf71d9b01091ed3994d67f7d042175e.webp)


### Coolant Temperature Sensor
![](images/10ea631b08202628eb1c90f1a78b6734776080f3a57e4c4cc64674662cb5e2e6.webp)  
Y220_06017

Coolant temperature sensor is a NTC resister that sends coolant temperature to ECU.

NTC resister has characteristicsthat if the engine temperature rises, the resistance lowers so the ECU detects lowering signal voltages.

If the fuel injectedinto theengine trough ijector has more turulence, then combusts very wel. However if engine temperature is too low, the fuel injected as foggy state forms big compounds causing incomplete combustion. So the sensor detects coolant temperature and changes coolant temperature changes into voltage then sends to ECU to increasethe fuel volume during cold start for better starting. And detects engine overheating for fuel volume reduction to protect the engine.

ECU functions as below with coolant temperature sensor signals.

•When engine is cold, controls fuel volume to correct idle speed   
•When engine is overheated, controls electrical fan and A/C compressor to protect the engine   
•Sends information for emission control

![](images/c620d6df92e6010f36bf7f8f48656d370df45a547f74ef631da8d6bf671c4481.webp)

![](images/25f8fdef73d9f650a6198f281cb326ea7860e517f51ad28cc2c30ad0e5a601f1.webp)

<Coolant Temperature Sensor Circuit>

![](images/54a919722b74f1f77e9cda48a77d0bd1975da1cbd1efc96df00e28ff8f5deef2.webp)


### Trouble Diagnosis
![](images/e9e9fb3c66b959eb3a4f79e5fb95f08a72ca4f367481c0a1032b68a378c4f21e.webp)

![](images/e09fa45bd23f826759f40271d2eb81790ef480a124f7779051b373bf5d2ade45.webp)


### INSPECTION
![](images/d9cc308cc08c333d3d678c01155996b1c62bf9c6af6ac1c85d6f25c574d05ff5.webp)

Release the pressure from coolant reservoir by loosening one notch of coolant reservoir cap, and then remove the cap.


### Notice
Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the before the temperature goes down below 90°C.


### Cooling System
![](images/eae1809ac52dc3755a6f26577ade3abd7d8d181042e928b786a2b9fc8d9a9066.webp)

Add the coolant up to upper mark (arrow) on the reservoir.

3. Install the tester to the coolant reservoir and apply the pressure of 1.4 bar.   
4Check the coolant hoses, pipes and connections for leaks after the pointer of the tester drops. Replace or retighten as required.

![](images/301176a52dced19b7ad436c9903b4ddb6c2f7db978d12cafd63dc1fbb7a501d3.webp)

Y220_06021


### Thermostat
Immerse the thermostat into the water. Heat the water and check the valve opening temperature.

![](images/5c139977594cebb2d1620cbbe9896bc6427eb8005c7962e18b2ebb0fba435d96.webp)

![](images/2d92a2de948dd50e560ce58499adeaca5ca7b95ce50fed045c0ee9fdb017cc04.webp)


### Coolant Temperature Gauge Unit
1. Immerse the senor unit into the water. Heat the water and check the resistance.

![](images/9bf92f39d5cef2a2229ce42d3dbb0593660814cf8c89cc3d7881e57917f5fbac.webp)

Y220_06022

2. If the measured resistance is out of specified value, replace the gauge unit.

3. Measure the resistance between terminal A and gauge unit housing, and terminal B and gauge unit housing.

![](images/21b5af7e9aa1118a11b23d4e33dbaaec9329599c2933d0e8abaa49d55e7d4dd8.webp)

![](images/9953c6c5cbb591aae131f13183f98aa0f91b22bbc2da08b70e9992a2d1ff054f.webp)  
Terminal A

Terminal B

Y220_06023


### Thermostat
1. Immerse the thermostat into the oil. Heat the oil until it reaches the specified temperature and check if the coolant temperature switch is turned “OFF”.

![](images/1fa6d7b9abbe75b946feae4ba8b4904be09dbd4c69aaa723f06fcb0024045362.webp)


### Notice
Use only engine oil for this inspection. Stir the oil during heating it. Never heat the oil over required temperature.

![](images/d94e667f8a01705a9e89c184a2f8fe96e21ead091e56095fb2b08bdf8a9616df.webp)

Y220_06024

![](images/d72b5b7bae156cdbfc6138892852d5f0b9de4d8b299564f45807c909d05268e1.webp)


### REMOVAL AND INSTALLATION
![](images/18d5ecf4768c67055b0870dec4ff303b7bcea012c67032adf234f2f5c5179f18.webp)


### Coolant Hose (Inlet/Outlet)
Preceding Work: Draining of coolant

1. Loosen the clamp and remove the coolant outlet hose (engine to radiator).

2. Disconnect the HFM sensor connector.   
3Remove the air intake duct from the air cleaner.

4. Loosen the clamp and remove the coolant inlet hose (radiator to thermostat housing).

Y220_06027

![](images/955ba5fc2b66c612abd0a50ba1784bea9888f64b2f9e12bda2858267907b9b5a.webp)

5Lift up the vehicle and remove the skid plate.   
6Loosen the clamp and remove the lower inlet hose.

![](images/9289dcabfdfefa1ee91cd1a9d3f41cdd7f0746f05df4b8ba96bd13cef2bd0667.webp)


### Shroud and Cooling Fan/Clutch
Preceding Works:

-  Draining of coolant   
- Removal of coolant inlet and outlet hose   
- Removal of V-belt

Remove the radiator grille.

Remove the air intake hoses.   
3. Set aside the coolant return pipe.

![](images/c8f366c6df7e0eac7ce5cff627e08e56c8c4e4b918a6f998f6af8d010460f24d.webp)

4.Unscrew the upper bolts and loosen the shroud.

![](images/4400deac73e997f4d62a3ad296d9bbb7db412e78d1b8820e08348d5b7d53c607.webp)

![](images/945fb345bcc91295f1baac39d23ced0327a82a0d33d9c343eaf993348a9e8b3c.webp)

5Unscrew the center bolt and remove the cooling fan clutch while holding the pulley with counter holder (special tool).

Installation Notice

![](images/1198ee40807d6d1fb5b230f07e65a943561039ae17bbf585bd40e51b623d0b37.webp)

6Remove the shroud.   
7 Install in the reverse order of removal.

![](images/8cec428a257f1c4ad1ad9dba6e5e51b9e8b340cc76d497c7f289b21ac53e2a09.webp)


### Water Pump - Assembly
Preceding Works:

- Draining of coolant - Removal of V-belt -Removal of shroud -Removal of cooling fan

![](images/a0b4687ecbe5ca8012eb5872b57deb81cb2759582f4511190a6129ea93cc9f17.webp)

Y220_06035

1. Thermostat housing 4. Belt pulley   
2. Gasket.. Replace 5. Bolt... . 10 Nm   
3. Bolt .. .. 10 Nm 6. Water pump

1.Remove the V-belt while pressing down the auto tensioner adjusting bolt.

![](images/e90cebcc2868894827b67df956de048d19484a002ed42dfafe79a655275c4dd6.webp)

![](images/66b8a55d53dff64562c11725501e105343f9bc156eda89d0c52f630c78372b0b.webp)

![](images/8b24e50f3f24177c3502cdd3357a36edc34b298cc9c8ef4e61a5b2888dd30fed.webp)

![](images/58ae667ba737c77c18868af94f3cf1a7c5790963f1dc8baf1afda02d736c6c86.webp)

![](images/d5c3e7b569d3da0f3778c5fd114aad78c8f5ed7deadf979bf480ab749d7de8bf.webp)

Unscrew the bolts and remove the EGR pipe and bracket. Installation Notice

![](images/05e5ab54c87045dbd0ef0c74e4fc3c387cc585ebec06afff25d1dead9145ac0e.webp)

3. Unscrew the bolts and remove the belt pulley while holding the belt pulley with a special tool.


### Installation Notice
![](images/aca58423ba7155f247f1a638585b5b07ee016301390cdd53ef627f65e5f625ac.webp)

Remove the oil dipstick tube.


### Notice
• Replace the O-ring in oil dipstick with new one. • Plug the oil dipstick hole with a cap not to get the foreign materials into the engine.

5Unscrew the bolts and remove the water pump assembly. Installation Notice

![](images/278337e773c7972caeb0f3055387d6daf0e997cc855ef4a34f321b62d8325b91.webp)


### Notice
Remove the gasket residues from the sealing surface and replace the gasket with new one.

6 Install in the reverse order of removal.


### \* Preceding Works:
-Draining of coolant   
-Removal of V-belt   
-Removal of cooling fan   
-Removal of intake duct (air cleaner to turbo charger)

![](images/71fe110a8bb01dc8f625de6cf502092ab5bba4863929e7dd532ad235fb9a855a.webp)

Y220_06041

1.Gasket. .Replace 5. Thermostat   
2. Water pump housing 6. Seal   
3. Connector 7. Coolant hose   
4. Bolt . . 10 Nm

![](images/f787476efea3d7e07654ce6f5ecdf058a0061fdd789c419808dc4995fbf0a4c9.webp)

![](images/906336207cb94ea5d700f5dba71e07286309c41b0fc6a0a2ee7228d9422a1c10.webp)

![](images/644efc2249fb889aad2235e7ebb0b76adc3093bea4ee4caee15ec4d600a4db42.webp)

Unscrew the bolts and remove the thermostat housing. Installation Notice

![](images/9232322133310e77179ca1a78d63773c8061f1e9ad4857c34c5319012405cda4.webp)

2Remove the thermostat.   
3 Install in the reverse order of removal.


### Water Pump Housing
Preceding Works:

-Removal of water pump assembly -Removal of thermostat assembly

Remove the heater hose.

Unscrew the bolts and remove the alternator. Installation Notice

![](images/c33a108ee276a47fa5e0e8aa60f25b46aa5258ac0fe55d1479bc6fdaf9fbf001.webp)

3. Unscrew the bolts and remove the alternator bracket. Installation Notice

![](images/2ce0bafd27ca124c83c7b27a2d73fe8efa6a011a86ecee5cb64ae65329fad530.webp)

![](images/c8970c3f7bed8197c93f30d79d1a03f824db75847ccf96dc41759ff6e0ff4e46.webp)

![](images/fec6324ef9dd02e51fb3da918c926facb1ab0a3eb984836061f47e8c2a371bf3.webp)

Unscrew the bolts and remove the water pump housing. Installation Notice

![](images/d506a4d85382bef0124bfc05cf9a2c69c721288b9136b11d87ac8b065088d39f.webp)


### Notice
•Be careful not to damage the O-ring in coolant outlet pipe (cylinder head side). •Remove the gasket residues from the sealing surface and replace the gasket with new one.

5 Install in the reverse order of removal.

![](images/e4e5bcddbe2b9e99946964d851bc954d08f3249e6f3a49131448341a17287907.webp)

![](images/4fd0abc16067f85913254e547d346e266910b8b54306ea45bb021f3f3e1122f9.webp)


### Radiator
Preceding Work: Draining of coolant

1 Lift up the vehicle and remove the skid plate.

![](images/e7e13a4a9c5ced539890aea7343ce2d4bdcdd809e40fb242bde09f71d447e80b.webp)

Remove the clips and washers from bottom of radiator at both sides.


### Notice
Be careful not to damage the rubber bushing.

![](images/57b1d45f9251a12c2ad68af020a6788d5ec963378487d2daf8c8f17f1a7bcdf9.webp)

3. Unscrew the bracket mounting bolts under the radiator condenser.

Installation Notice

![](images/f9057ac1b962702b422f8bd73fba0aef79f835afc4b9196161aa7925a52e5e54.webp)

![](images/d3447a9a2b39a02a6f15fd60923fc73830c11210959cfce5eb569ac4dc0d1706.webp)

![](images/22f7c75627a68fd7778c33adf2837ba12fac08d913cf36605a56afc84e0fee70.webp)

4. Disconnect the oil inlet and outlet hoses from bottom of radiator.


### Notice
•Plug the radiator oil holes with caps.   
•Replace the hose washers with new ones.

Remove the coolant outlet hose.

![](images/337740ec29e9345708955ae3ba0a1f26f42eda2e0a9e6bfcc408b41d107200cc.webp)

Remove the radiator grille.

7. Remove the coolant inlet hose and the cooler inlet hose.   
8Remove the coolant return hose.

9Unscrew the bolts and remove the shroud.

![](images/6cc0c04ea899d5fe8a0b3b980038588c3d8ef5646db3db8e8d5af860ccb4d1f5.webp)

![](images/04c546b85e3c32079b910fd2fc980d5c898f5aa8afb795980cb66de44eb6184e.webp)

![](images/726b23c6e9b2412bb052e8bc9d9fa3b42d722e85c6dcf6ddd6524c1f772c3ebe.webp)

10.Unscrew the bolts and remove the radiator upper plate. Installation Notice

![](images/b3a66514e2b0a4f4619100eded9f5c44ef70bbbc8ebebe6c7a7a7922671557e3.webp)

11. Unscrew the bracket mounting bolts on the radiator condenser.

Installation Notice

![](images/5f34c4ae15e5d52d67aa2eedaae879c232adc257e371b4f5ff115591d87aff64.webp)

1Remove the radiator by pulling it up carefully.

13 Instal in the reverse order of removal.

![](images/715ee5402f1ee71ef2d2abb138ea115205fb58c1c95eb150b9abe873d1d6b8c2.webp)


### Coolant Reservoir
1. Drain the coolant.   
Remove the hoses.

![](images/515f12e9a270ddb2bbf2bbfb07f73b79f103f21d0d0d687e1d67b66e520d9b97.webp)

3. Unscrew the bolts and remove the coolant reservoir. Installation Notice

![](images/09d26af44c3f0b335900d5a347f97b71e06d6b47f7adfa6133c33fae0ade31be.webp)

4 Install in the reverse order of removal.

![](images/45df026df5c852b790de65148dee4efff1b7eea10ad8178f4768bf6d5d9a1ece.webp)

![](images/930cdcf4555e3ca67a672f400b6c0a5cfb39dee26da36562044148bd0b1e9c83.webp)


### Draining and Adding of Coolant
Release the pressure from coolant reservoir by loosening one notch of coolant reservoir cap, and then remove the cap.


### Notice
Scalding hot coolant and steam could be blown out under pressure, which could cause serious injury. Never remove the coolant reservoir cap when the before the temperature goes down below 90°C.

2. Loosen the drain plug in bottom of radiator and drain the coolant.


### Notice
Collect the drained coolant with a proper container.

3.Remove the drain plug (1) and seal (2) in the cylinder block and drain the coolant.

Replace the seal with new one and install the drain plug. Installation Notice

![](images/84b9e33fae2f97637d36e0a51fcb6aa40f0fb0939e95d61d18f686fbc2a8865e.webp)

5 Install the drain plug in bottom of radiator.   
6. Add the coolant through the coolant reservoir.


### Notice
•Keep the coolant mixture ratio of 50:50 (water : antifreezer).   
•Add the coolant until the water flows out through the overflow hose.

7.Warm up the engine until the thermostat begins to open and check if the coolant level is at “FULL” mark on the reservoir. Add if necessary.

![](images/e6a1e9faef77cff589306fbaa41a18458b48886bad1a2f31ac7ef3b7b06c4419.webp)


### PREHEATING SYSTEM
![](images/2d91a3cc786853c8d001b20e126dd81df57a3e5d79ac4281e656b0e6c3fb39d4.webp)

![](images/9f5c651e69d5797976e07981b2b9aa602256301cd5d158d05c9b1192b35441c0.webp)

![](images/41b8d2a3b7513bf270649847694c1303d770c6a7435fcffd02d72e14e6fe386b.webp)


### OVERVIEW
Glow plug is installed on the cylinder head (combustion chamber) in the D27DT preheating control unit system. Col starting performance has improved and exhaust gas during cold starting has reduced.

ECU receives coolant temperature and engine speed to control; after monitoring the engine preheating/after heating anc glow plug diagnosis function, the fault contents will be delivered to ECU.

•Engine preheating/after heating functions   
•Preheating relay activation by ECU controls -Senses engine temperature and controls the preheating/after heating time - Glow indicator   
• K-LINE for information exchanges between preheating unit and ECU - Transmits preheating unit self-diagnosis results to ECU -Transmits glow plug diagnosis results and operating status to ECU


### Structure
![](images/20ffd44261cd83c1242031483b92796e302dfb1a081d785dbdc77bf4da86517b.webp)

![](images/6872142ce15fa5e9702427e138ae111f2cc233bd54ee2006d27881ac081ded8f.webp)


### PREHEATING SYSTEM DIAGRAM
![](images/6c538abcf6e03788d8e1b95ecc705674bb20fd09f99c5867d3aad7949137a789.webp)

Y220_06070


### Specifications
![](images/222ff8d9d7d9108dfecf8d0e01f40e85ff20b3cf160277e9587bbcac5e8df7f2.webp)

![](images/dfbdd79cc963bddac823758b09019520f08669a3d06302d1e750506f03327f23.webp)


### Function
Preheating system controls and checks follwing functions and operating conditions.


### Pre-Heating
The power wil be supplied to the glow plugs by ECU controls when the power is supplied to the IG terminal from the battery and there are normal communications with ECU within 2 seconds. The surface of glow plug will be heated up to 850°C very quickly to aid combustion by vaporizing air-fuel mixture during compression stroke. Preheating time is controlled by ECU.


### After-heating
When the engine is started, after-heating starts by ECU controls. The idle rpm wil be increased to reduce toxic smoke, pollutants and noises.   
After-heating time is controlled by ECU.


### Checking glow plugs
•Check each glow plug for short in circuit •Check each glow plug for open in circuit due to overvoltage Check glow plug for short to ground


### K-Line communication
•ECU sends the results to preheating time control relay through K-Line to start communication.   
Preheating time control relay sends messages including self-diagnosis data for glow plugs to ECU.   
•Glow plug makes communication only as response to demand.   
•When power is supplied, ECU starts self-diagnosis within 2 seconds.   
•Under the following conditions, communication error occurs. -When there is no response from glow plug module within 2 seconds -  When an error is detected in checksum -Less byte is received

Error code of “P1720 - Pre heating control communication fail” will be reported.


### Operating time
![](images/d024a638301b9115d17c6dd5bfffd48e48dfa30db789a20307366fc6974fb5c5.webp)

![](images/4e3c07ed080a343327fe6585271ff5a483a96b4d48ed337435cf075b3a266686.webp)


### Table of Contents
CAUTIONS FOR DI ENGINE. .DI07-3   
FUEL SYSTEM. DI07-6   
Fuel injection system DI07-6   
Fuel transfer line. DI07-12   
Inlet metering valve (IMV) DI07-14   
High fuel pressure line DI07-17   
Injector DI07-48

![](images/07e77534c3b4b62544d12ef458cb803b4ef7b61aab63e79848bff042b2db3f72.webp)


### CAUTIONS FOR DI ENGINE
This chapter describes the cautions for DI engine equipped vehicle. This includes the water separation from engine, warning lights, symptoms when engine malfunctioning, causes and actions.


### DI Engine
Comparatively conventional diesel engines, DI engine controls the fuel injection and timing electrically, delivers high power and reduces less emission.


### Water Separator Warning Light
When a severe failure has been occurred in a vehicle, the system safety mode is activated to protect the system. It reduces the driving force, restricts the engine speed (rpm) and stops engine operation. Refer to “Diagnosis” section in this manual.

When the water level inside water separator in fuel filter exceeds a certain level (approx. 39 cc), this warning light comes on and buzzer sounds.

Also, the driving force of the vehicle decreases (torque reduction). If these conditions occur, immediately drain the water from fuel filter.

For the draining procedures, please refer to “How to drain the water from fuel filter" section.

![](images/087be59af74147eaedf9c9722e79c64efc614b019c406d742e62bdd5e4e1f48d.webp)


### Priming Pump
The priming pump installed in fuel pump is the device to fil the fuel into the fuel fiter. When the vehicle is under the conditions as below, press the priming pump until it becomes rigid before starting the engine.

WARNING

Never reverse filter or use it in other place (clean side)


### Conditions for using Priming Pump
1. After run out of fuel After draining the water from fuel separator 3. After replacing filter or any intervention on system


### Fuel Filter and Water Separator
![](images/1acc366a2c4063337e95b1442e67b5ded47c595f67f9f9fdacdc2a7adcd17351.webp)

![](images/8a8f59848fe0375ef62d4837392f6ad3f535406fa272714e2b2f2e730ef074c0.webp)

Y220_07003

1. Fuel filter   
3. Priming pump

2. Water drain plug (to be drained every 15,000km max.) Draining could be done at same time than oil change


### Notice
When replaced the fuel filter or drained the water from fuel filter, press the priming pump until it becomes rigid before starting the engine. •The water drain from fuel filter should be performed whenever changing the engine oil.

![](images/6a50245ed7886769d8e73d28179a4d8ff3e148ee1a10f8e4a610134c4541ce36.webp)


### Draining the Water From Fuel Filter
1Place the water container under the fuel filter.

![](images/f72dd8d6e3cab7d2367b7189be0e073817bc83816cbfa5b478b54cdf74837352.webp)

Turn the drain plug (2) to “A” direction to drain the water. 3. Press priming pump until all water is drained, then turn the drain plug to “B” direction to tighten it.


### Notice
Be careful not to be injured by surrounding equipment during the working procedures.

![](images/ebc3564bc4435862b0ad7c7f785c7de6d035086938ca2aa555ff4150dd7294f1.webp)

4.Press the priming pump until it becomes rigid.   
5. Start the engine and check the conditions.   
6. Clear the fault code of ECU with scan 100.


> ⚠️ **Внимание:** If the priming pump is not properly operated, air may get into the fuel line. It may cause starting problem or fuel system problem. Make sure to perform the job in step 4.
>
> ![](images/00273787e2f8de2e6c840a1f56550bbaea55969714d19219ba6cb1a300b4a665.webp)
>
> ![](images/3157f151d189bb548c752e3c0c69c090a8ec0fb0fef6b6c8b9a798da3834a120.webp)


### Electronic Control of Fuel System
![](images/6c50c1aa7d90717ef5868c4fb4240580916f480cfaedee4671b5b9766e015841.webp)


### System composition
- High pressure fuel pump - Fuel rail - Fuel pressure sensor Rupr ine - Fuel injector - Electronic control unit (ECu) - Other sensors and actuators ECU connecting line Y220 07007

According to input signals from various sensors, engine ECU calculates driver's demand (position of the accelerato jedal) and then controls overall operating performance of engine and vehicle on that time.

ECU receives signals from sensors via dataline and then performs efective engine air-fuel ratio controls based on those signals. Engine speed is measured by crankshaft speed (position) sensor and camshaftspeed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal thatis generated by variable resistance changes in accelerator pedal sensor. Air flow (hot flm) sensor detect intake air volume and sends the signals to ECU. Especiall, the engine ECU controls the air-fuel ratio by recognizing instant air volume changes from air flow sensor to decrease the emissons (EGR valve control. Furthermore, ECU uses signals from coolant temperature sensor and air temperature sensor, booster pressure sensor and atmospheric pressure sensor as compensation signalto respond to injection starting, pilot injection set values, various operations and variables.

![](images/3077c069313a3fae79c2aa2ac0858c6f5f9e6b78c330cf4bc920839b81ba9991.webp)


### Composition of Fuel System
Components in fuel system are designed to generate and distribute high pressure, and they are controlld electronically by engine ECU. Accordingly, fuel system is completely diffrent from injection pump type fuel supply system on the conventional Diesel engine. The fuel injection system in common rail engine is composed of transfer pressure section that transfers fuel in low pressure, high pressure section that transfers fuel in high pressure and ECU control section.

![](images/7999cda2e2c55eff24ad3f3eb2e1751db15bd33f5fee61ba14c842c1d29b5f16.webp)

Fuel route

![](images/db2f086379111027adb01b11fe431df7dbeff6c8e0ab5c1b6b9401ef0c159713.webp)

![](images/f524bd85a87d55711907a51a27171ddadf5ffcd47c714cca1292dc01a73db9de.webp)


### Hydraulic cycle in Fuel Line (Transfer and High Pressure Line)
![](images/07f4083779e523eb508c3b3d2279d7e3305f9bcf25a6cb8a2b262020f66a7415.webp)

Y220_07009

![](images/f6a17ceaa031a4849d1d130dbc57f2c22d1f6bb9729e62cf0233ec9bbd69c078.webp)


### Components of Low Pressure Transfer Line
Low pressure stage is to supply sufficient fuel to high pressure section and components are as below.

•Fuel tank (including strainer)   
•Hand priming pump   
Fuel filter   
Transfer pump   
•Other low pressure fuel hoses


### Fuel tank
Fuel tank is made of anti-corrosion material and its allowable pressure is 2 times of operating pressure (more than 0.3 bar). It has protective cap and safety valve to prevent excessive pressure building. Also, it has structure to prevent fuel from leaking in shocks, slopes and corners and to supply fuel smoothly.

![](images/9a89ff4af9110f1ff7fce8045d3c486a6170978c61b95c6b11ab40b577cc108e.webp)


### Priming pump
If fuel runs out during driving or air gets into fuel line after fuel filter replacement, it may cause poor engine starting or damage to each component. Therefore, the hand priming pump is installed to bleed air from transfer line.

When the vehicle is under the conditions as below, press the priming pump until it becomes rigid before starting the engine.

-  After run out of fuel - After draining the water from fuel filter -After replacing the fuel filter

Press the priming pump until it becomes rigid before starting the engine.


### Fuel filter
It requires more purified fuel supply than conventional diesel engine. If there are foreign materials in the fuel, fuel system including pump components, delivery valve and injector nozzles may be damaged.

Fuel filter purifies fuel before it reaches to high pressure pump to help proper operations in high pressure pump. And more, it separates water from fuel to prevent water from getting into FIE system (high pressure line).

![](images/19e469c472b1cae4eee3ed9a81f825b4c08b88c2942e5da56b6da9b4d1b8b50d.webp)

![](images/971613504e069f331a04a958e48d8ab8639f5bd510945c3a297e4568860334e2.webp)

Y220_07012

![](images/61d0d1260a4cf35c6fa316170f9986b97ae1b198dd392b7b1e118e6b6f886df4.webp)


### Components of High Pressure Transfer Line
In the high pressure section, sufficient fuel pressure that injectors requires wil be generated and stored. The compo nents are as below:

•High pressure pump   
•Rail pressure sensor   
Pressure limit valve   
• Common rail   
•High pressure pipe   
Injector   
•Fuel pressure regulating valve (IMV)

![](images/e9217158b724e889a61926fd96c717dc309f866526031b0837f20e8905c0a244.webp)


### High pressure pump (including IMV and limit valve)
This is plunger pump that generates high pressure; and driven by crankshaft with timing chain. The high pressure pump increases system pressure of fuel to approx. 1,600 bar and this compressed fuel is transferred to high pressure accumulator (common rail) in tube through high pressure line.


### Common rail (including pressure sensor)
It stores fuel transferred from high pressure pump and also stores actual high pressure of fuel. Even though the injectors inject fuel from the rail, the fuel pressure in the rail is maintained to a specific value. It is because the effect of accumulator is increased by unique elasticity of fuel. Fuel pressure is measured by rail pressure sensor. And the inlet metering valve (IMV) included in high pressure pump housing keeps pressure to a desired level.

![](images/c0341785c4e732c4620f3b961510cbc2eaf0af77dfd54104c3feb1e632550cf6.webp)


### High pressure pipe (fuel pipe)
Fuel line transfers high pressure fuel. Accordingly, it is made of steel to endure intermittent high frequency pressure changes that occur under maximum system pressure and injection stops. Injection lines between rail and injectors are all in the same length; it means the lengths between the rail and each injector are the same and the differences in length are compensated by each bending.

![](images/82bfe5a38d26400e955ef0871a3d800a1814fc8330b692a0f32627284fb16094.webp)


### Injectors
The fuel injection device is composed of electrical solenoid valve, needle and nozzle and controlled by engine ECU. The injector nozzle opens when solenoid valve is activated to directly inject the fuel into combustion chamber in engine. When injector nozzle is open, remaining fuel after injection returns to fuel tank through return line.


### Transfer pump
The transfer pump is included in the housing of the high pressure pump. The transfer pump is the volumetric blade type pump. To deliver the continuously required fuel volume, the pump transfers fuel from the fuel tank to high pressure pump.

![](images/9c9c82017ee606803e0cd9e893071ae0b7a2e817793938095b8bcb36f0699fb9.webp)


### Fuel Filter Replacement
\* Fuel filter change interval: every 30,000 km   
\* Water separation interval: every 15,000 km max. (same with engine oil change interval)   
\* Never reuse the removed fuel filter

![](images/3df3350b029b3f3089674edd2b0faa241699db9c7270ab2222ff9d5b8f0b0557.webp)


### Description
The transfer pump is the device to provide suficient fuel to high fuel pressure line and is mechanical type feed pump that is driven by timing chain linked to crankshaft. This mechanical type feed pump is subject to air iflow, therefore, a hand priming pump is installed to fillfuel in Low fuel pressure(LP) circuit.

The transfer pump is included in the housing of the HP pump. The transfer pump is the volumetric blade type pump an consists of the following components:

•A rotor turned by the shaft of the HP pump. The connection is provided by splines.   
Aneccentric liner fixed to the housing of the HP pump by 6 Torx bolts. The liner is positioned by two offset pins in order to prevent any assembly errors.   
Four blades set at 90°. Each blade is held against the liner by a coil spring.   
The inlet and outlet orifice.

![](images/c4dd5017da9627da3f96cc89c0bde8899c7922d831130143537b9c7e4f69d527.webp)

![](images/004e3706d76389df059ed94395000c792625f910709a0b0751799113e081a4bc.webp)


### Principle of operation
![](images/a2e299f8f3fe70bc1248e4cff4acdda6884c579b6ee927ccbcadd6030f0c4e82.webp)

Y220_07025

Jonsider the chamber between the rotor, the liner and two successive blades (refer to above figure).

When the chamberi in position 1, the volume of the chamber is minimal. The changes in volume according to the angle of rotation of the rotor are small.   
•The rotor makes a quarter turn clockwise. The previous chamber is now in position 2. The inlet orifice is uncovered. The volume contained in the chamber quickly rises. The pressure inside the chamber drops sharply. Fuel is drawn into the chamber.   
The rotor continues to rotate. t i now in position.The nlet and outlet rifices are now sealed of.The volume area controlled by the rotor, the liner and the two blades is at the maximum. The changes in volume according to the angle of rotation of the rotor are small.   
The rotor continues to rotate. It i finall in position 4. The outlet orifice is uncovered. The volume area controlled by the rotor, the liner and the blades decreases quickly. The pressure inside the chamber rises sharply. The fuel is expelled under pressure. The depression caused by the transfer pump's rotation is suficient to draw in diesel fuel through the filter. The transfer pump is driven by the shaft of the HP pump, transfer pressure thus rises with engine speed.A regulating valve allows the transfer pressure to be maintained at a practically constant level (about 6 bar) throughout the whole range of engine operations by returning some of the fuel to the pump inlet.

![](images/981904386f72759a1a1d6fc3f9d345778b80b323c79474d09b76d66125480eca.webp)

Y220_07026


### Characteristics of the transfer pump
![](images/89b2899dc909a688e8d2858e044950fba9ce98bc4711d07d7d35474be1aef945.webp)
FUEL SYSTEMDI ENG SM - 2004.4

![](images/0869ec39296ff2d65caf2d991210e6ed1f3d33aacbb5032e6c854807a4c8fc1f.webp)


### INLET METERING VALVE (IMV)
![](images/efae912089c4b2d16dc58a094bdd42dabd4e476a6776a84b6920d1e17f3fa15f.webp)

![](images/bf2824619b6affed6d0e1efa72e370201ef9b9f2f060d59cd3f36bd820ce036e.webp)


### Overview
The LP actuator, also called the inlet metering valve, is used to control the rail pressure by regulating the amount of fuel which is sent to the pumping element of the HP pump.

This actuator has two purposes:

Firstly, it allows the efficiency of the injection system to be improved, since the HP pump only compresses the amount of fuel necessary to maintain in the rail the level of pressure required by the system as a function of the engine's operating conditions.

2. Secondary, it allows the temperature to be reduced in the fuel tank. When the excess fuel is discharged into the back leak circuit, the pressure reduction in the fluid (from rail pressure down to atmospheric pressure) gives off a large amount of heat. This leads to a temperature rise in the fuel entering the tank. In order to prevent too high a temperature being reached, it is necessary to limit the amount of heat generated by the fuel pressure reduction, by reducing the back leak flow. To reduce the back leak flow, it is sufficient to adapt the flow of the HP pump to the engine's requirements throughout its operating range.

![](images/110f28f873dc36376085ca39518cdf27535594c9c84e20d7398c2fcc5627153a.webp)


### Composition of IMV
The IMV is located on the hydraulic head ofthe pump. It is fed with fuel by the transfer pump via two radial holes. A cylindrical fiter fitted ver the feed orifices of the MV. This makes it possible to protect not only the LP actuator, but also all the components of the injection system located downstream of the IMV.

The IMV consists of the following components:

•A piston held in the fully open position by a spring.   
•A piston filter located at inlet.   
•Two O-rings ensuring pressure tightness between the hydraulic head and the body of the IMV.   
•A body provided with two radial inlet holes and an axial outlet hole.   
Coil

![](images/c946ae37651a449f7146f31c706f8fdda4b476311117642d6a86b10714b65da6.webp)

Y220_07019

![](images/cf6d8556983a6584ff749e85662768e1a14b2daf9ced03afd8eccac38641f256.webp)


### Principle of Operation
The LP actuator is used to proportion the amount of fuel sent to the pumping element of the HP pump in such a way that the pressure measured by the HP sensor is equal to the pressure demand sent out by the ECU. At each point of operation, it is necessary to have:

•Flow introduced into the HP pump = Injected flow + Injector backleak flow + injector control flow The IMV is normal open when itis not being supplied with fuel. It cannot therefore be used as a safety device to shut down the engine if required. The IMV is controlled by current. The flow/current law is represented below.

![](images/0c1ed57e438cb5fcb19daf459382650d6dda1b09dfbf16fe4c137a42e2cd11f2.webp)


### Specifications
![](images/ad3f8e3757553356a4cdd0d23b20a7f0da3dc506ef3c6cc4fd49e5b606223b53.webp)

•ECU determines the value of the current to be sent to the IMV according to:

![](images/076f4bfdf89c99c79f62a38c5ce937f2e709021d1acd23f1f357b01077202303.webp)

![](images/4747a8f10cf7a1bbb996cffc594e2dac5e2f08e00f9514587f420b855fb78634.webp)


### Description
This pump generates high fuel pressure and is driven bytiming chain (radial plunger principle). This pump pressurizes the fuel to approx. 1600 bar and sends this high pressurized fuel to high pressure accumulator (common rail via high pressure line.

It is possible to extend the pumping phase in order to considerably reduce drive torque, viration and noise since the pump no longer determines the ijection period.The difrences from conventional rotary pumpslie in the fact thatit i no loger the hydraulichead rotor which turs inside the cam, but the cam which turns around the hydraulichead. Thus, any problems of dynamic pressure tightness are eliminated because the high pressure is generated in the fixed part of the pump.

![](images/b053e032e052097ff13898ecf90640874e97754b74154238e77527a359b6bc0d.webp)

1. IMV (Inlet Metering Valve)   
2. Hydraulic Head   
3. Plunger   
4. Drive shaft and cam ring   
5. Housing   
6. Roller and shoe   
7. Transfer pump   
8. Fuel temperature sensor   
9. High fuel pressure - OUT   
10. Pressure regulator

Y220_07021


### Specifications
•Maximum operating pressure: 1600 ± 150 bar   
• Max. Overpressure: 2100 bar   
Maximum sealing pressure: when using a plug instead of PRV, no leaks around pump outlet port (when applying 2500 bar of constant pressure)   
• Operating temperature: Continuously operating within temperature range of -30°C \~ 120°C in engine compartment   
•Inflowing fuel temperature: The maximum inflowing fuel temperature is 85°C (continuously able to operate)   
•Pump inlet pressure: Relative pressure Min. - 0.48 bar (to end of filter's lifetime)   
•Driving torque: 15 Nm / 1600 bar   
•Gear ratio (engine: pump): 0.625   
Lubrication: - Inside lubrication (rear bearing): Fuel - Outside lubrication (front bearing): Engine oil

![](images/a8d6183b67af2c501654e5fdc1b584b49424dac4b64fd7b6ca07da96a6e16eb1.webp)


### Principle of operation
During the filing phase, the rollers are kept in contact with the cam by means of coil springs mounted on either side of each shoe. The transfer pressure is suficient to open the inlet valve and to move the pumping plungers apart. Thus, the dead volume between the two plungers fills with fuel.   
When the diametrically opposite rollrs simultaneously encounter the leading edge of the cam, the plungers are pushed towards each other.   
As soon as the pressure becomes higher than the transfer pressure, the inlet valve closes. When the pressure becomes higher than the pressure inside the rail, the delivery valve opens. Consequently, the fuel is pumped under pressure into the rail.   
•During the input phase, transfer pressure pushes back the inlet valve. Fuel enters the body of the pumping element. The valve closes as soon as the pressure in the pumping element becomes higher than the transfer pressure.   
During the input phase, the ballof the delivery valve is subject to the rail pressure on its outer face and to the transfer pressure on its inner face. Thus the ballrests on its seat, ensuring the pressure tightness of the body of the pumping element. When the pressure in the element becomes higher than the pressure in the rail, the ballis unbalanced and it opens. Fuel is then pumped into the rail at high pressure.

![](images/ba3669a249ff0d1327e001d12af00606140bc2f16b6bc4eb617d5a8a59bec89c.webp)

Y220_07022

This high pressure pump generates the driving torque with low peak torque to maintain the stressto driving components. This torque is smaller than that of conventional injection pump, thus, only a small load willbe applied to pump. The required power to drive pump is determined by set pressure for rail and pump speed (delivery flow). Note that the fuel leakage or defective pressure control valve may affect the engine output.

![](images/45d72e797dcecc294d6b5def0837bc1e46ce97068c22cb35400290b6e5fb9dc0.webp)


### Inlet valve and delivery valve
During the input phase, transfer pressure pushes back the inlet valve. Fuel enters the body of the pumping element. Under the effect of the transfer pressure, the two plungers are forced apart. When the rollers simultaneously encounter the leading edge of the cam, pressure suddenly rises in the body. Of the pumping element. The valve closes as soon as the pressure in the pumping element becomes higher than the transfer pressure.During the input phase, the ballof the delivery valve is subject t the rail pressure on its outer face and to the transfer pressure on its inner face. Thus the ball rests on its seat, ensuring the pressure tightness of the body of the pumping element. When the two diametrically opposite rollers encounter the leading edges of the cam, the plungers are forced together and pressure quickly rises in the body of the pumping element. When the pressure in the element becomes higher than the pressure in the rail the ball is unbalanced and it opens. The spring calibration is negligible compared with the pressure forces. Fuel is then pumped into the rail at high pressure.

![](images/86968b36c07422a97955cbd7dcc49522406460286cbb15727c0926bf49d9b369.webp)


### Lubrication and cooling of the HP pump
Lubrication and cooling ofthe pump are provided by the fuel circulation. The minimum flow required to ensure adequate operation of the pump is 50 /h.


### Phasing of HP pump required and offer 2 advantages
Conventional fuel injection pumps ensure pressurizing and distribution of the fuel to the different injectors. Itis essential to set the pump in such a way that the injection occurs at the required place during the cycle. The HP pump of the common rail system is no longer used for the fuel distribution, it is therefore not necessary to set the pump in relation to the engine.

Nevertheless, the setting or phasing of the pump offers two advantages:

It allows the torque variations of the camshaft and the pump to be synchronized in order to reduce the stresses on the timing belt.   
It allows pressure control to be improved by synchronizing peak pressures produced by the pump with pressuredrops caused by each injection.

This phasing allows pressure stabilityto be improved, which helps to reduce the difference in flow between the cylinders.

![](images/829bee459aa1ea45ca770faa0c4e52c3befa40cba443fcb867b37b79b495037f.webp)


### HP Pump Fuel Route
The fuel passed through the fuel fite is sent to the transfer pump via the HP inlet pump. this fuel passes through the transfer pump by the transferring pressure and maintains the predefined value by the regulating valve in HP pump. Also, this fuel gets into the IMV that controls only the fuel to the high pressure pump.   
The below figure describes the pump operations when acceleration and deceleration.


### When need high fuel pressure (acceleration)
![](images/c893697df27b97f3c171a3eedb956e1f98918ab7a5ee390c7426d8ce4e38c36b.webp)

![](images/cba46955b9b163d78d32b5e44654d9c65ae0b29bfe097db3ac9c2a0d6cee20db.webp)


### When do not need high fuel pressure (deceleration)
![](images/dedab216ae986430c6566c0ad7d29bf6b4568b5075659d2b1b6cfdb86cd25b97.webp)

Y220_07030

The fuel is sent t the high pressure side (hydraulic head) and compressed by the plunger. And, goes into the commor 'ail through the high pressure pipe.

The IMV installed in the high pressure side (hydraulic head) of HP pump precisely controls the fuel amount and delivers he rail pressure feedback same as required amount.

The IMV is controlled by ECU.


### Performance curve of HP pump
The time required to obtain a suficient pressure in the rail to enable the engine to start depends on the volume of the system (defiition of therail, ength of the pipes, etc..The aim is to reach a pressure of 200 bars in 1. revolutions (rd compression).

•Maximum operating pressure: 1600 ± 150 bar

![](images/927c4cf624fa9b273dd655d099ffafefa5e8cfd4ef08d620d37c802f9f7335b8.webp)

![](images/84eeec46fae1bbcac2247fe30be380ecdba9509030141b3bd31a33f44214f84d.webp)


### Sectional View of HP Pump
![](images/3b22f1623419e7a9863f5e683433b97c200c89719862a6ae20fa3f99ec4a891e.webp)

![](images/961d599db1829de938409f62026adbc8a722ef798ab29ae3f252545afff25c03.webp)

![](images/d6e3d319ddbda418cbf1569edb0831270f4e321c01ab8461d4f043d8d7d4b0da.webp)

<Inlet Valve, Outlet Valve, Shoe and Roller, Temperature Sensor>

Y220_07034

![](images/ae4032e581984f58719b00c04d2f83d424a7c979ef5d2cd41a47f9fcdb1d16a8.webp)

Y220_07035

![](images/e0ac0199b91794769128fd645df5eb39306ee59293d628026f74451b6e291a84.webp)


### Removal
Preceding Works

-Disconnection of negative battery cable -Removal of engine cover

The trouble diagnosis should be performed before removing the HP pump. Refer to “Diagnosis” section.

1.Remove the bolts on the fan shroud. Disconnect the air intake duct from intake manifold and the coolant outlet port connecting hose.


### Notice
Plug the coolant port not to get the coolant into the engine. Add the coolant as required when installing.

![](images/b262a8612165976014bd4e6829ef8b28e4e474663f6a63b3628d0da1f02043a1.webp)

2. Remove the fan belt while pressing down the auto tensioner adjusting bolt.

3.Unscrew the center bolt and remove the cooling fan clutch while holding the pulley with counter holder (special tool).

![](images/69ddec28cedbf92e6a7cc3673ac0d13a8ed50803f39099f48193ae6af38cf9b1.webp)

4Remove the fan shroud and fan clutch simultaneously.

![](images/e8a3ac8686ae7c5d08ebb756e6311320328828e2ca8fd48f72a9a2d06f0afa16.webp)

5. Unscrew the bolts and remove the belt pulley while holding the belt pulley with a special tool.

![](images/e797a676292902483d7dd9ee3f9a8c6c8fc59509d40ccf57ec269b1d6083d234.webp)

![](images/dc382fdb8a574a99f60c9c66edb5feb5ba39cc9f1d7b791925216e0d81d7f6ce.webp)

6Unscrew the upper and lower bolts and remove the auto tensioner.

![](images/8ef8768acafe0937ae54802a237838e1cd5b99b65282e237ff9ebcf9f14b9aee.webp)


### To prevent oil leaks, store the removed auto tensioner in upright position.
7. Unscrew the bolts and remove the idle pulley.

![](images/a2c571b352371e820b124486a231ef18e4486b54080f5796bc1da9963c78f7c0.webp)

![](images/c069ab9c65632aafa27d010f930a139b7b3af5a77d0d3f49a4215308666b028b.webp)

Unscrew the bolts and remove the cooling fan bracket (timing chain cover side).

![](images/5152e48dbd450202af5e8f044519779855b8303b67d7f42edbf38c055b74d85e.webp)

![](images/9ba71f1ac1de265888161ec7c5ac9c808717117b89ff593811a6e3b8b1c8590c.webp)

![](images/e031c92494af7ba2d496662056361acd01e61ec560779f03fb0df32036983d14.webp)

![](images/d54887d8d5918f5e36f89410f8ec94a4f343bbb7ac5e6bd9d3f7cb1be9b312e7.webp)

![](images/ecba662ed1be2109bd4d982d723a97357d6b1933df0d677c054d462a44701eca.webp)

Remove the engine oil filler cap and adjust the mark on camshaft to TDC position.

10. Align the TDC mark on the crankshaft pulley to the guide pin and rotate the pulley 720° counterclockwise. Check the mark on the camshaft again.

11. Disconnect the vacuum line of EGR vacuum modulator (1), the vacuum line of turbo charger vacuum modulator (2) vacuum line and connectors.


### Notice
Be careful not to be mixed the lines when installing.

12. Unscrew the bolts and remove the intake manifold mounting bracket.

- Upper bolts: 13M/ 2EA Lower boltes: 5M/ 2EA (Hexagon bolt)

![](images/c633f0b3962d7b49c463cd999bb78f77d6a6ca8cc150bb379cede8c8dcd5005a.webp)

13. Disconnect the connector behind HP pump, fuel pipes and hose lines.

1) Fuel temperature sensor connector (green)   
2) IMV connector   
3) Fuel return hose (be careful not to break the HP   
pump connecting port)   
4) Venturi hose


### Notice
Plug each opening with sealing cap.

14. Remove the coolant temperature sensor and the knock sensor.

![](images/b22d979e1d70b017c4a65cd61a877f9027f55fda5a7f37274e4fb279df4f4f63.webp)

15. Unscrew the bolts and remove the high fuel pressure pipes at HP pump and common rail. Plug the openings with sealing caps.

![](images/40cef9acad7e21a38d302f56185ac9394cffd7990980c18ba46d15d49ff669c9.webp)


### Notice
Replace the fuel pipes with new ones.

![](images/5bbab56ce50ce8e751716e22e25edd15d2c271fbfd57c0871c1d8d38ad070bf0.webp)

![](images/1b0f6c652db5e32e6ec3fb856892964420e74700d460337a89a37c7614ee1d8f.webp)

16.Remove the HP pump mounting bracket at engine.

![](images/88de55182489c6c458b05242bc7f89f3df9ecb1a74074279f3264709cd1d1521.webp)

![](images/e09746801d875ca07f0b77ecf9b2987d0df2f31ed9270ca007aabb1023ef3256.webp)

![](images/453d1c6f88a857b90fc55cb65ad0bc52701a2ddc4f29a29b92984b8aba3d990e.webp)

![](images/e85b95e227349fb87d9fc20039b463898e43a35dc2385b4b8b162a7674e716b4.webp)

![](images/404d5abdd15aa6a874110838ab90e978c1e66528a97ea198467deecf83d604a2.webp)

![](images/134355230aa79bb224afe2b0c5a2a30baa810604676d25b79bc3f27655c7ac59.webp)

17. Remove the intake EGR pipe and gasket.


### Notice
•Replace the removed gasket with new one. • Replace the removed #1 and #3 pipes with new ones.

18. Disconnect the HFM sensor connector.

19.Loosen the clamp and separate the hose from air cleaner.

20. Separate the connection lines from turbo charger and PCV separator.

2.Remove the exhaust EGR pipe and gasket (Front side - 10 mm/ 2EA, Exhaust side - 13mm/ 2EA). Remove the center EGR pipe and mounting bolts (13mm/ 4EA).


### Notice
•Replace the removed gasket with new one. •Replace the removed #1 and #3 pipes with new ones.

22. Remove the oil dipstick mounting bracket and oil dipstick tube with O-ring.

![](images/69971f8fd069f88395fbe3814f66f757d6aac62b1ab105057c97db0cf0998e4e.webp)


### Notice
Replace the O-ring with new one.

23.Remove the chain tensioner.

24. Mark on the HP pump sprocket and timing chain.

![](images/123e0b16583e41abe1c5642eb27c630f02a6cbef72dc64e6ad3e053e4b465a55.webp)

![](images/c21a93a97a8bcc245aa480a1fb16c50672ca66793ac9b64d1d47eb2ffff3fec9.webp)

![](images/02751c9fcfe450101ffe30a542a3fe869cc3a7c2d46fba358342e35202f47221.webp)

![](images/e36ba542ff722ac43946c1ce854cf4458a4dfad72d8639c5cfa179864dbb9a63.webp)

![](images/7dfc8a7a547fc371afeee24ce55ed6af9688918516948817cb57dfb5abd7238d.webp)

25Remove the guide rail pins (lower and upper) with a special tool.

26 Install the special tool (1) for holding HP pump sprocket, unscrew the mounting bolts and remove the sprocket. At this time, rotate the crankshaft 30° to 45° counterclockwise to remove the sprocket.

![](images/a088187605a2851c47f6cde9c35f9403aa673f1f49be634e75e0eff713610adc.webp)

27.Remove the center nut for HP pump shaft.

![](images/712da00ea15a5fa50260fcf5a424db02bdcfc324730fb94627a13a6ffa155e6f.webp)

28. Pull out the HP pump bearing with a special tool.


### Notice
Be careful not to damage the bearing.

29.Remove the HP pump bearing bracket (13mm - 3EA).

![](images/99bf5886ba4a4d4e8da57920efed87bbee4448b86810d26d09eb8e16304b3a61.webp)

30. Remove the mounting bracket behind the HP pump.   
31. Slide the HP pump out rearward while holding it.

![](images/da874ed45c505c55928899deaac033102c174f4338dd387406abf186ebe62243.webp)


### Notice
Plugs openings and put it in a box (for returns)

![](images/ba3b8db02e916359509dee5cc4df59d5b450a307dee0f4065448b5ceca402509.webp)

![](images/3e44f08988129341040bc7a28bb9b35ef8431963ae6ca1a3e2795dac358760e1.webp)

Y220_07064

1.HP pump sprocket   
2. 12-sided bolt (20 Nm + 90°)   
3. HP pump bearing housing   
4. HP pump (High pressure pump)   
5. HP pump shaft   
6. HP pump center nut (65 ± 5 Nm)   
7. HP pump external bolt (24 ± 2.4 Nm)   
8. HP pump bearing shaft   
9. Oil gallery   
10. Bearing bushing   
11. Gasket

![](images/8a055248332e523cb88611f5bd9a359c2f54bfd80a827e22c3e1a44caa454dfd.webp)


### Installation
Install the gasket and HP pump.

Notice

Replace the removed gasket with new one.

Warning

Remove caps at last minute and always change removed HP pipes.

Install the HP pump bearing bracket and HP pump to the cylinder block.

![](images/96d29e892df9cf9cf74d1e089e18f542afffc775cc4f15e8ae2293d198ef438d.webp)


### Align the oil galleries in cylinder block and bearing bracket.
Install the bearing into the bracket.

4Temporarily install the upper and lower guide rails to seat the chain. 5Temporarily tighten the center nut for HP pump shaft.


### Notice
Be careful not to rotate the shaft.

![](images/1c07ea89f128c91f2d69cde00dbd3a9d99796c52ff5199f283300a5b83db18c3.webp)

6. Install the timing chain on the sprocket and lock the sprocket with a special tool.


### Notice
Do not apply excessive force to the timing chain. Otherwise, the TDC point deviates from correct position.

![](images/048080e5995e87af3d651383cf61a09e3fefd2702b592fededbe0961697b9500.webp)

![](images/ace146a24c3deea7389f71a717e2bc757a0e3aecc040eac53623a3c102f3244f.webp)

![](images/ae083b16b1c0d2ebae7991e38305805dd8a1dc20f17d36725459a4f12a7f10b4.webp)

![](images/69d08a59b6e25e02cbb0be3cb8d0626f8464d72f49f56264b173c3bf2ad6c7dd.webp)

7. Tighten the center nut for HP pump.

![](images/bbf59b48359c3bc52bb28b63039eb497e1e779f49c631b1c70dfc879fbe95918.webp)


### Notice
Replace the center nut with new one.

8. Press the upper and lower guide pins into the guide.


### Check the timing chain and guide pin for contact.
9. Align the marks on the HP pump sprocket and the timing chain and tighten the bolts.

![](images/5b628b2443698225ff3a7e04f316f38f58c8a87e7c70394cf507e958d50e3f00.webp)

10Remove the special tool.

11. Install the mounting bracket behind HP pump.

![](images/7c634bb52046bd698c95e9c4b0c32a6615a6325b5a7c3422a46a6e0301574543.webp)

12 Install the chain tensioner.

![](images/f7ac64e2950890f3a4ecb7606336de6b9298621673375b2d1c7b1100954bb1b1.webp)


### Notice
•Replace the chain tensioner washer with new one.   
•Be careful not to drop the washer into the hole.

13.Check if the mark on the intake camshaft is at the correct position through oil fller opening.


### Notice
Rotate the bolt on crankshaft damper pulley two revolutions and check if the mark on the intake camshaft is at the correct position.

![](images/daee102d10c99835c04d312419b92401ade2a2de8dade83011c1ecd476c8c9d7.webp)

14. Clean the timing chain cover parting surface and apply the sealant on it.

![](images/7d9fc9ca20e9bdc4607174caebdafad89871409b11a25e82376f1e46a25fe5df.webp)

1 Install the timing chain cover.


### Align the cover and the guide pin.
![](images/17cbd4822d6a906dffd1bf2139375c09770bc87b8a34fb9cdc66cd19db04d1e2.webp)

16. Install the auto tensioner assembly.

- Upper bolt (24M):

![](images/93ff06f29c5c231a4b69fa0ddbf8da4340ed4f6802447dcecb6a1929e6392712.webp)

![](images/92f9e95afe30bf36ed6b1b262cdd64953734e5a75ffee88c182fef6e8edc81bf.webp)

![](images/73a8afc49d6b3a14aa10f8a1d70617bdb5227afe6d4e967497b134d7b8ffb364.webp)

![](images/504f5f6eb977a76cb309983f6a5033305311a1190aef9f13bdbf0718400289ac.webp)


### Notice
If the initialization of fuel pressure has not been performed, the engine ECU controls new HP pump with the stored offset value. This may cause the poor engine output.

17. Install the coolant pump pulley.

![](images/f9e680beb9bee7a12d3be28e375b1d0806155563f4514d1756281be4ea673901.webp)

18 Install the fan clutch with a special tool.

![](images/698916986d0843211ee962ec7f5d7616ff6a49c37ca2f50d5924051c85262010.webp)

19. Install the oil dipstick tube and bracket.

![](images/5687b52a9c93b0f597a0cd94d31e2c99ef4e157c3b5493b8b5534177da35902a.webp)

20. Install the exhaust EGR pipe and bracket.

![](images/3e8169d2c6539cbeb771aa6f9ca23aef4af5066510c4f3b010a81e2aef86ff1e.webp)


### Notice
Make sure that the convex surface of new steel gasket is facing the direction as shown in the figure.

Gasket Installing direction

2Engage the turbo charger and PCV separator connecting lines.

22Engage the air cleaner hose and tighten the clamp.

23.Connect the HFM sensor connector.

24. Install the EGR center pipe.

![](images/4e86df5f7e6b729629405d9f83fc45188fa9dc88eb06ac2c2675c47dd758d039.webp)

2Connect the HP pump connectors and engage the hose lines.

-Fuel temperature sensor connectors and IMV connector - Venturi hose and fuel return hose

26. Install the coolant temperature sensor and the knock sensor.

27.When replaced the HP pump, initialize the fuel pressure by using Scan-i. Refer to “Trouble Diagnosis” section in this manual.

![](images/b88389feea2d9872988b71783cef6292af91585f7609fd41247f1927206a2d56.webp)

27. Install the vacuum modulator to the intake manifold bracket.

28. Connect the vacuum modulator connecting lines and connector.

(1Vacuum modulator for turbo charger control (Vacuum modulator for EGR valve control


### Notice
Ensure that the vacuum hoses are connected to correct positions.

29. Connect the hose to coolant outlet port and tighten the clamp.

30. Install the air intake duct.

31. Install the fan belt while pressing the auto tensioner adjusting bolt.

![](images/fbd92e5ce4aaa13da333b54f53a1305011e19af6db9d6187a70e8b2d5e918933.webp)

32 Place the fan shroud in its location and install he cooling fan by using an open end wrench.

![](images/cc0aa20f9559967d41009f7eb9ced481dff908f7df96b0ee1e17ec9c9c966b8f.webp)

33. Install the fan shroud.

34. Add the coolant.

35. Check all the connections for tightness and pump the priming pump to deliver the fuel to the transfer line of HP pump.

36Start the engine and check if abnormality is present.

37. Run leak detection cycle to get rid of air in the system using scan 100.

![](images/e3f780e51518347f0546e6d2346ac71ce147d9276e54bb78782583491ed83a7f.webp)


### Function
Foreign materials in fuel can damage the pump components, transfer valve and injectors. Therefore, the high pressure direct injection engine must use fuel filter. Otherwise, the operation performance will drop dramatically And, diesel fuel may contain water due to condensation by temperature changes and this condensation water can damage the system by corroding the injection system. Thus, the common rail engine should have function that can drain water periodically.

![](images/0982c8ec90e0e63fe094a3c2753c46593584724509f5ebd6c56c39fd72994bc4.webp)

![](images/9e3357332c81df72cf4f176cf87ac1ae42b25c077db4467d216ce1d65f7e31c3.webp)


### Water separation and storage function
Function: It separates the condensation water from diesel fuel to prevent the water from getting into FlE system, and results in protection of FIE system. (manual drain)   
•Water storage capacity: 120 cc   
Water sensor: light if over 39 cc   
Water drain interval: When changing engine oil or every 20,000 km


### Water sensor
tis integrated in the filter and sends signal to ECU when water level reaches at a specified value (over 39 cc) i the filter :o let the driver drain the water.


### Fuel De-Waxing – Improving starting performance in cold weather
Due to characteristics of diesel fuel, some of fuel components solidify during cold winter under below a specific temperature (15°C). When those symptoms happen, engine may stall however, some of the fuel (temperature rises due to high compression) in the HP pump in D27DT engine returnto the filter to warm up fuel when temperature is below 50°C by improving cold start performance during cold winter.

![](images/1b970e1ab259b51d56dac4872116f18c097a93670e800b3749c0917f0e292c51.webp)

![](images/dafa7fa1d26bc25823e17a9efa9be0179ff76a668ee573f4e3e1c71b0678c81c.webp)

![](images/a4e4a0b3bd7dfc107bef28cc28802cbf211a6abeeefc009d641065a26813baac.webp)


### Notice
• Plug the openings of hoses and fuel filter with sealing caps.   
• Ensure that the hoses are connected to correct positions.   
2. Loosen the bracket bolts and disconnect the hose from the drain plug.   
Remove the fuel filter.   
Install in the reverse order of removal.   
5Press the priming pump until it becomes rigid to deliver the fuel to the transfer line of HP pump.

![](images/3005ebdb6a681fd2b09d20fe55843c81b15a13b4882f7713c41f163279618f5e.webp)


### Priming Pump
If fuel runs out during driving or air gets into fuel line after fuel filter replacement, it may cause poor engine starting or damage to each component. Therefore, the hand priming pump is installed to fill filter.

When the vehicle is under the conditions as below, press the priming pump until t becomes rigid before starting the engine.

Conditions for using Priming Pump -  After run out of fuel -After draining the water from fuel filter -After replacing the fuel filter

![](images/02cd81f5f1ac03ea91e2a056d136544f16dc873a89db247ae5dfab87724537d1.webp)


### Notice
When the fuel filter is replaced, the fuel in the fuel tank should be transferred to the filter by using priming pump. So never transfer the fuelin the fuel tank to the fiter by driving HP pump with cranking the engine.


### б Relations Between Pressure and Temperature In Fuel Transfer Line
![](images/813a18c6e088d7934c2df98a667f8943e10d060d69e19800430f56b13831059e.webp)

Y220_07087

The fuel transfer line is the line between fuel tank and HP pump inlet port. The pressure on this line affects the lifetime of fuel filter.

•Temperature of fuel transfer line

- HP pump inlet temperature is less than 80°C.   
- The temperature of fuel pump inlet is up to 80°C. And, diesel fuel has lubrication effects due to its viscosity. Thus, the fuel is also used for pump lubrication. However, this lubrication performance drops as the temperature rises. Accordingly, when the fuel temperature is over 50°C, 100% of fuel is returned to fuel tank to cool down the temperature and then increase the lubrication effects of fuel and prevent heat damage on each section of high fuel pressure line.

![](images/5f548829934217f53db465791ae8be23f3d378a19504d0a4c7a375f740296198.webp)


### Description
The high pressure accumulator reserves the high pressure fuel. Simultaneously, the pressure changes due to the delivery from HP pump and the fuel ijection is diminished by rail volume. This high pressure accumulatoris commonly used in all cylinders. Even when a large amount of fuel leaks, the common rail maintains its internal pressure. This ensures that the injection pressure can be maintained from when the injector opens.


### Function
Relieve the pressure pulsation •Provide pressure information to ECU (fuel pressure sensor)


### Specifications
Material: Forged Steel   
Dimension: - Volume: 22 ± 1cc - Length: Max. 397.7 mm - Outer diameter: 25.3 mm   
•Fuel pressure sensor Integrated type - Sensor input voltage: 5 ± 0.1V - Sensor output signal voltage: - 4.055 ± 0.125 V @ 1600 ± 15 bar - 0.5 ± 0.04 V @ 0 bar   
• Operating pressure range - Normal condition: 0 \~ 1600 bar - Max. Overpressure: 2100 bar   
•Ambient temperature: - available within -40°C \~ 125°C -Spontaneous max. temperature after engine stops: 140°C (acceptable against total 15 hours)   
•Fluid temperature: -40 \~ 100°C under normal operating conditions   
•Removal and installation: 10 times without any damage

![](images/c346cdfbf7ed93e66531a77727137a13a48aa5909969d576c4ec0b55c70fe031.webp)

![](images/b3f6f40e48f199820077b5fa06d73599292a2a005a629a5c241ec8d45492f1bb.webp)

Y220_07089


### High Fuel Pressure Pipe
Function: Resistant to pressure changes, tightness against surroundings, supplying fuel through pump, rail and injector with high pressure

•Material: Steel (Zn Plated)

Common: Cylinder 1 & 3, 2& 4,5

Internal pressure

- Internal operating pressure: 0 \~ 1600 bar during its lifetime   
- Spontaneous max. pressure when restoring: 2100 bar (max. total period: 20 hours)   
-Bursting pressure: over 2500 bar

To keep cleanness and tightness, the high pressure pipe assembly should be used only once.


### Notice
•Make sure to replace the removed high fuel pressure pipes.   
•Tighten the fasteners with the specified tightening torque.

![](images/3e08572936ad9598ae588c63363bdfdaaf32edce4aa426510afe57e6e21d31b3.webp)

![](images/b44ffd9f105f8217cb374c96fa75b28926325798c6629fb9fbad13dc74d45c26.webp)


### Removal and Installation
Preceding Work: Removal of engine cover

1. Disconnect the fuel pressure sensor connector.


### Notice
•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps. •Check pressure is low before opening the circuit.

Unscrew the nuts and remove the fuel supply main pipe from the fuel line.

Installation Notice   
![](images/4913cb4754f2339910009eb656d8379a9c4452c03af608f1166bdedb6aca843a.webp)


### Notice
•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps.

3Unscrew the high fuel pressure line nuts and remove the fuel pipes.

Installation Notice   
![](images/7b2b0352075e9f45ebcd46850f82cd09fe3f1b5ddfe5ce6f3286a3edb9c0fd55.webp)


### Notice
•Replace the fuel pipes with new ones. • Plug the openings of hole in the common rail with sealing caps.

![](images/59b0092df2613fcff5588b8f0ecfb1d5d09893a5a3c2080ee4d3baf7b70716e3.webp)

4. Unscrew the bolts and remove the common rail asssembly.

Installation Notice

![](images/0bdfbd53a531a4dccca5b7c4ca6d24340e12243145c1d18effdce6c577d0125b.webp)


### Notice
•Replace the fuel pipes with new ones. •Plug the openings of hole in the common rail with sealing caps.

5 Install in the reverse order of removal.

![](images/648b19d1dd42bd15a53e5d93d39914e7a68dbcef403c8b2deebda3ca1f73dc0a.webp)


### Fuel Pressure Sensor
![](images/2d82062b7f3d9fb4062a0d0d8aa57869f2659c79f87814231e905853ab5e2111.webp)

-uel pressure sensor on the center of common rail detects instant fuel pressure changes and then sends to ECU. When 'eceived these signals, ECU uses them to control fuel volume and injection time.

The fuel inthe rail reaches to sensor diaphragm via blind hole in the pressure sensor and the pressure signal converts to electrical signal. The signal measured by sensor will be amplified to input to ECU.

his piezo element type sensor changes pressure into electrical signal. Accordingly, when the shape of diaphragn :hanges, electrical resistance in the layers on the diaphragm changes then can measure 0.5 \~ 5 V.

• Sensor input voltage: 5 ± 0.1 V   
•Output signal voltage of sensor - 4.055 ± 0.125 V: 1600 ± 15bar - 0.5 ± 0.04 V: 0 bar

![](images/24c52420c0170323f0496388e6c71561c12dd71d9378017f15465377ea84bd5b.webp)

![](images/3456dab214845fa17ab8ea5f33841183896d42805a52601a7e77765fed42d60e.webp)

![](images/3982882322e4a164d89ea0d9e7148f09ebce1eba06d2634a62375ad63a6d5822.webp)

![](images/9c382fde928d7df110d449ce52e0a1bc44c6eb272359a84104eb75f2460d8dd8.webp)

![](images/5f24e7901558a5ee8c51abc22432f5101cf30a772a92709995576a34795ccfdc.webp)


### Fuel Temperature Sensor
![](images/96898cee663d1123aef1088f87bf361f0e9716a6111d171611c02cff471039d9.webp)  
Y220_07098

Fuel temperature sensor is a NTC resistor that sends fuel temperature to ECU.

In case of NTC resistor, the resistance lowers if engine temperature rises so the ECU detects lowering signal voltages. Fuel temperature sensor is installed on the fuel return line to correct pressure after measuring fuel temperature. 5V is supplied to the sensor and voltage drop by temperature is delivered to ECU to measure the fuel temperature through analog-digital converter (ADC).

Notice

Fuel temp sensor not to be dismounted.

![](images/08d5ff941fb1f322388e18f390185d56e499988359a6b1224625a36ce9bfdb7a.webp)

Y220_07099


### HFM Sensor
- Refer to “Intake System”

Crankshaft Position Sensor -Refer to “Engine Assembly”

Knock Sensor -Refer to “Engine Assembly”

Camshaft Position Sensor -Refer to “Engine Assembly”

![](images/d9f63771942ce26146e27b1fbd615e5b4460529569800a0ea6149a923b512fa6.webp)


### INJECTOR
The C21 labels including injector characteristics are attached in each injector. These C21 values should be input to ECL by using Scan-i when replacing the ECU or injectors.

Special cautions:

1. Plug the openings of hoses and pipes with the sealing caps.   
Replace the copper washer with new one plus injector holder bolt & washer.   
3Tighten the injector holder bolts with the specified tightening torque.   
4Be careful not to drop the injector.

![](images/fe19c0257d6e222a1e21796e53fa163f3b4ea8cd18e95370258cae1df7f4428a.webp)

![](images/c88d21769dd81759754babbe73dbf4fc6ccf2c8fcaadb5b097448dae90f0c2f2.webp)

The maximum injection pressures are approximately 1,600 bar. The forces to be overcome in order to lift the needle of the ijector are therefore very large. Because of this, it  impossible to directly control the injector by using an electromagnetic actuator, unless very high currents are used, which would be incompatible with the reaction times required for the multiple injections. The injector is therefore indirectly controlld by means of a valve controlling the pressurizing or discharging of the control chamber located above the needle:

When the needle is required to lift (at the start of injection): the valve is opened in order to discharge the control chamber into the back leak circuit.   
When the needle has to close (at the end of injection): the valve closes again so that pressure is re-established in the control chamber.


### Valve
In order to guarantee response time and minimum energy consumption:

•The valve must be as light as possible. The valve stroke must be as short as possible. The effort needed to move the valve must be minimal, which means that the valve must be in hydraulic equilibrium in the closed position.

Spring pressure ensures contact between the valve and its seat. To lift the valve, itis therefore required to overcome the force being applied by this spring.


### Spacer
The spacer is situated underneath the valve support. It integrates the control chamber and the three calibrated orifice which allow operation of the injector. These orifices are:

•The injector supply orifice (Nozzle Path Orifice: NPO) •The control chamber discharge orifice (Spill Orifice: SPO) The control chamber filing orifice (Inlet Orifice: INO)

![](images/4beb4a325c71eab3184132e670cc46d87e41f6a7247d9734000d7d2c10bdbc37.webp)

![](images/642ba4cda202e15a2e90dc59c83b476707fdd9a94ae6a3352c858f4798293367.webp)

![](images/39db4d31f4967767b8fc6b2a39557c77de6774b699aefb2b0a082ecc018035f1.webp)


### Principle of Operation
![](images/ea980fefd5c430e04d69fd5547dbc098081a866f6b18729c1ad5585e656ee8b3.webp)

![](images/e0ee9dc51572dc68d528217d9e296a377977381fc0451abe31f57d555f171f97.webp)

Y220_07103


### Injector at rest
The valve is closed. The control chamber is subject to the rail pressure.

The pressure force applied by the fuel onto the needle is:

The needle is closed and hence there is no fluid circulation through the NPO orifice. While static, the nozzle produces no pressure drop. The cone of the needle is therefore subject to the rail pressure. The force applied by the fuel to the needle is:

Since Ff > Fo, the needle is held in the closed position. There is no injection.

\* S: The area of the flat upper surface of the injector's needle \*A: The area of the needle surface situated above the section of contact between the needle and its seat \*Ff: The force applied by the fuel onto section “S" \* Fo:The force applied by the fuel onto section "A"

Y220_07104

![](images/c2489a2665d887c409e34d9de6c4ae8a6cd232082e9c8f9b86516a6c1a8ca4ba.webp)


### Solenoid valve control
When the solenoid valve is energized, the valve opens. The fuel contained in the control chamber is expelled through the discharge orifice known as the Spill Orifice (SPO).

As soon as Ff > Fo, the needle remains held against its seat and there is no injection.


### Start of injection
As soon as Ff < Fo, or in other words:

Pcontrol < Prail \* A/S

The neede lits and injection begins. As long as the valve is open, the injector's neede remains lifted. When injection begins, fuel cirulation is established to feed the injector.The passage of the fuel through the inet rifice of the ijector (similar to a nozzle) leads to a pressure drop which depends on the rail pressure.

When the rail pressure is atis highest (1600 bar), this pressure drop exceeds 100 bar. The pressure applied to the cone of the needle (the injection pressure) is therefore lower than the rail pressure.


### End of injection
As soon as the solenoid valve is de-energized, the valve closes and the control chamber is filed. Since the needle is open, the thrust section areas situated on either side of the needle is therefore to apply different pressures to each of these faces.The pressure in the control chamber cannot exceed the rail pressure, soi is therefore necessary to limit the pressure applied to the needle's cone. This pressure limitation is achieved by the NPO orifice which produces a pressure drop when fuel is passing through it.

Prail \* S ≥ (Prail - ∆ P) \* S

When static, this pressure drop is zero. When the pressure in the control chamber becomes higher than the pressure applied to the needle's cone, the injection stops.

![](images/ca326e0844434090afae9d9d4a88ce44efe9cc11d7719de7e7fdabc0a51d0bc8.webp)


### Injecting Process
![](images/97d60cfd10e92f552814fc6997cebb24b707757d21fe4b01e84b38d72ef89b3a.webp)![](images/666d29e78b3ead096acfb34ed3e2fc7c865f6dc20c6cdd3827f439cf43f27400.webp)

![](images/6829ff495e00837cac66bd87cc0ca8a8f47bf1b7fd5da403718d46586dc2d9b5.webp)

![](images/6203a694d4eea4d6e3aa7717ec415c6da1a4ecea9bbe0fc5ac4f890384a9aa56.webp)![](images/edce2bc82e6e4dae2046473b03cb8c507c5ec127c37d1900277db06b5131e317.webp)

![](images/52275bdd185a77a9ecde8479337c29a0f9672fbf8f62e4b1b246ec5e33bb3d42.webp)

![](images/74bffa8c2ceda181f324f8e9de6fe477a6fa821038a9bb09a11374f07c8295c2.webp)![](images/1f042df26a34ced8301946750804784880523196c7e83fb62b905f18cc6f3eaa.webp)

![](images/60082ccb8ca023ff6177f311e3a643e13c24832404d5b3d4f0ddde371e17f02f.webp)

![](images/9eb80f46b7b1884431d2131f8d6a6d3bbcf0b00bbbf3df3256e4c5e4455f25cb.webp)![](images/299c1416ee2be654dce96f361f35c4f304e0b829260231c616c88fc987aae4f5.webp)

![](images/b462f548361f472198790c420b8266b06f7adf218e7ac433a59082a739be2499.webp)

![](images/0c9422087350200d5cefbd10cb8e38fd188aa92804e890241d1fec75d38d4493.webp)

![](images/5c708519cf1bdbdc3cc4105f1d056bdd99a99752d28025effaf2a3c4c5c99c71.webp)

![](images/cc12e19138346d590184310ea0dcf4720730e380ab38b2d3c9843d037072b4fe.webp)


### Fuel pressure
•Minimum operating pressure: start injection over 100 bar   
•Maximum operating pressure: 1,600 bar (max. operating pressure in normal conditions)   
•Max overpressure: 2,100 bar


### Maximum fuel volume at each injector cycle
Pilot Injection ≤ 5 mm3 Main Injection ≤ 85 mm3 (within 200 \~ 1,600 bar)

![](images/fc34974ee6eed358dbbfd5bd7f1ef0976d7acd043b09bd1c2fa4135d9b22ba74.webp)

Y220_07110

•Small injection separation: min. 200μs (duration between the end of pilot injection and start of main injection)   
•Opening Delay   
: Delayed time from applying operating voltage to start of injection   
•Adjustment of feedback injection volume: C2I

![](images/4ae2ba367332bc76c8f595b1da89bed5c6b63875d8b7b16c5cd2a674ea3a1712.webp)

![](images/c54cc959b21e38b9af3c8c2f3bb45470af5cc0d7942ac3ee9e06e29f75ed101a.webp)


### Injector control
![](images/4a9252dbcf151b6626a117a5cdc5a43d255d0dedba248e9a96c80a59b572f502.webp)

Y220_07112

The control current of the coil takes the following form:

The low current allows the Joule effect losses in the ECU and injector to be reduced.The callcurrent is higher than the 1old current because during the hold phase.

The air gap between the valve and the coil is reduced and the electromagnetic force to be applied to the valve ca thus be reduced. It is no longer necessary to overcome the valve inertia.


> ℹ️ **Примечание:** Joule Effect: The principle that the heat produced by an electric curent is equal to the product of the resistance of the conductor, the square of the current, and the time for which it flows. I: current (A) R: resistance (2) T: time (sec) H: calori (cal)
> Heat capacity (H) = 0.24 I²RT
>
> ![](images/136c9b5cd0f0ae8c7c48c23156b2874f7de7c24cd95191dca880b17600d135db.webp)


### Fuel Injection
Other than conventional diesel engine, common diesel engine use two steps injection as follows:

Pilot Injection •Main Injection

In above two step injection, the fuel injection volume and injection timing is calibrated according to fuel pressure and fue temperature.


### Pilot injection
3efore starting main injection, a small amount of fuel is injected to help proper combustion. This injection is for reducing he engine noise and vibration.

In other words, i makes the pressure increase in combustion chamber during combustion smooth to reduce the engine noise and vibration (suppressing the surging). Basic values for pilot injection are adjusted according to the coolant temperature and intake air pressure.

![](images/2727916bb3bb3f802f6e1bb7e4d5bac455ebe055588fddea6c74e104c647da99.webp)


### Main injection
Actual output from engine is achieved by main injection.

The main injection determines the pilot injection has been occurred,then calculates the injection volume. Accelerator pedal sensor, engine rpm, coolant temperature, intake air temperature and atmospheric pressure are basic date to calculate the fuel injection volume in main injection.

![](images/d655977ebfb0089b158beab0cf01e732005a6900a5cfdcbdc3932aa5cd9adfcc.webp)

1. Pilot injection   
2. Main injection   
1a. Ignition pressure with pilot injection   
2a. Ignition pressure without pilot injection

<Characteristic curve of combustion chamber pressure during pilot injection>

Y220_07114

![](images/5a207be7760511a6a34c85f7ecc0ab92bece4f5786fc72178884332f5124d892.webp)

![](images/25ff3bd9aac6fde4a3e03668c9376ed48ccf2d04dc68089937da973c04ed5c86.webp)

![](images/0b9be467ffc385b1411a1e0a0ab80c46edfc362c5ea27091c5e945df2316f323.webp)

![](images/5a7b3f62f43f70ccb26ebf0566ed16da52f789d7f9d8e8956b6b5918e9e8f25f.webp)


### Removal and Installation
Preceding Work: Removal of engine cover

1. Disconnect the injector return hose.

Notice Plug the openings with sealing caps.

Remove the relevant connector for the injector.

Unscrew the bolts and remove the fuel pipes.


### Installation Notice
![](images/397ff53d0b942b552da92121664a82ff3692273c4f6d985ff641fff986c55cea.webp)


### Installation Notice
•Replace the fuel pipes with new ones. • Plug the openings of the common rail with sealing caps.

Unscrew the injector holder bolts.


### Installation Notice
![](images/78b1d3af330833d4a8500dfb6e6ba807888cca66d5a78c297476715c825001fd.webp)

Replace the bolts and washer with new ones.

Disconnect the injector holder.

6Remove the injectors with a special tool.


### Notice
•Plug the openings of the injectors with sealing caps. •Pullthe dropped washer out from the engine with a special tool. •Clean carbon deposite in hole with specific tool.

7. Install in the reverse order of removal.

8 Do not forget to update C2l with Scan 100 and cross old C2I on label fited on engine.


### Notice
Replace the copper washer, holder bolts and washer and fuel supply pipes with new ones.


### ECU Wiring Diagram
2 п D H 1#о #10 # 2#10 V 2   
Sdd d 5 4 3 2 3 1 2 ε# #   
3 6 4 2 К х ON Wown or b П Ф V XX ) o 1 o 8 хх о0   
T N Jdis indno os 0o d (  ) H 0   
2 K 3 5 3 4 0 5 3 1 8 2 4 3 2 3 38 18 8 2 2 F 3 00 801 8 8 8 0 2 21 21 2 0 2 41 11 11 811 320   
п   
3 1 u 2 − 17 1 y 3 8   
ho (1 0 4 y   
40 \$ D   
3   
с 9 ++\$   
L 2 єз 1 8 х 2 + + L □ 4

![](images/e21478bdf4763b3b523113eab52d3b34c80f7a9c26d43015e0753ff77b0c87b3.webp)

![](images/3b4430a162989f6bac08def44ce20496df8c2cb4b131d0e1c60b7dbe79c55887.webp)


### SENSORS FOR DIAGNOSIS. ..083
Engine ECU and other components .. DI08-3   
Top view . DI08-4   
Side view . DI08-5


### ENGINE CONTROL SYSTE.. ... 86
ECU DI08-6   
Fuel pressure control DI08-12   
Fuel injecstion control. DI08-13   
Fuel flow control. DI08-14   
Individual injector calibration (C2I) DI08-19   
Minimum drive pulse (MDP) learning. DI08-21

![](images/81f27680d05643422d2c7668b3d09b2439fbe5e3ee796ba0e09b38314a74a3d9.webp)


### ENGINE ECU AND OTHER COMPONENTS
![](images/0304b0fecb41af94eb970c4e579cf1d03f2eb6fe0f6afbffc4852d7472af4510.webp)

![](images/c598d2b3e5e2df2d4e90dd7f891f63d75dc0894d1ee34130d80e0aa6433bc439.webp)


### TOP VIEW
![](images/05970e6f3a108ef2a40974fb1640f052db9068d5a65e3f7fc63d950177bed2a7.webp)

Y220_08002

![](images/fe23c3cb4b7ff7a414e77b71736e396c40e9993dc4e24bacab5cf8d1fd36aa61.webp)


### SIDE VIEW
![](images/576234c3cc119acc46896de5932d64bb625b84c00f8917ecf6c0bd53e88e4976.webp)

![](images/cadad59c77ef7d8099afad6ceb7e521f7d1b266ff0a197428fe28a7d0566240b.webp)


### ECU
According to input signals from various sensors, engine ECU calculates driver's demand (position of the acceleratol pedal) and then controls overall operating performance of engine and vehicle on that time.

ECU receives signals from sensors through data line and then performs effective engine air-fuel ratio controls based on those signals.

Engine speed is measured by crankshaft speed (position) sensor and camshaft speed (position) sensor determines injection order and ECU detects driver's pedal position (driver's demand) through electrical signal that generated by variable resistance changes in accelerator pedal sensor.

Air flow (hot film) sensor detects intake air volume and then transmits to ECU. Especiall, the engine ECU controls the air-fuel ratio by recognizing instant air volume changes through air low sensor to pursue low emission gases (EGR valve control). Furthermore, the ECU uses signals from coolant temperature and air temperature sensor, booster pressure sensor and atmospheric pressure sensor as compensation signal to respond to injection start and pilot injection set values and to various operations and variables.

![](images/04d36d7c80445bfa0870ddd8f9d512de3f96e0113d696a37cff793393040e740.webp)

![](images/cf1c2f72ac61b4ef15b7b534e3f101499053e7f263fafc174016f6d5fda7406c.webp)

![](images/6f72a9e84d38b4d2456631d1daa31e90367140f704b340b5877cfbc348c39f85.webp)

![](images/6a23a026c247993cc98c3528050284cbd8d7573fc5a6b439c87f3eceb5ae6276.webp)

![](images/3ab40e9912197068dcaad7ed79af5eb3559b518d7e1e43906b015de28ca289cd.webp)

![](images/fb624df18a4fb12c0f2e4297949ec7e0830fd9819b1ef87fe44ebe4cbd0cfd45.webp)


### ECU IОРХФУбOХФРХФУ
Inputs Control Output Booster pressure sensor Atmospheric pressure sensor Injector (Built-in ECU) EGR system Air flow sensor (HFM) Fuel pressure regulating valve (IMV) Coolant temperature sensor Electrical fan control (Low/High-speed) Fuel temperature sensor E A/C compressor relay Fuel pressure sensor Glow plug relay Fnock sster sesor C Wanig ghts crankshaft position sensor (Water warning light, glow plug indicacamshaft position sensor U tor light, engine warning light) Accelerator sensor Preheater (auxiliary heater) Vehicle speed sensor K - line Switch input signal CAN communication (IG, brake, clutch, A/C signal, A/C Self-diagnosis compressor)


### Function of ECU
:CU receives and analyzes signals from various sensors and then modifies those signals into permissible voltage levels nd analyzes to control respective actuators.

ECU microprocessor calculates injection period and injection timing proper for engine piston speed and crankshaf angle based on input data and stored specific map to control the engine power and emission gas.

Output signal of the ECU microprocessor drives pressure control valve to control the rail pressure and activates injector solenoid valve to control the fuel injection period and injection timing; so controls various actuators in response to engine changes. Auxiliary function of ECU has adopted to reduce emission gas, improve fuel economy and enhance safety, comforts and conveniences. For example, there are EGR, booster pressure control, autocruise (export only) and immobilizer and adopted CAN communication to exchange data among electrical systems (automatic T/M and brake system) in the vehicle fluently. And Scanner can be used to diagnose vehicle status and defectives.

Dperating temperature range of ECU is normally-40  +85°C and protected from factors like il,water and electromag etism and there should be no mechanical shocks.

To control the fuel volume precisely under repeated injections, high current should be applied instantly so there is njector drive circuit in the ECU to generate necessary current during injector drive stages.

Current controlcicuit divides current applying time (injection time) into fullin-current-phase and hold-current-phase anc :hen the injectors should work very correctly under every working condition.

![](images/f0a293c1832b403556d9dee03f053b6f4b0455c1bc693a2b142f9c73bbdc7427.webp)


### Control Function of ECU
•Controls by operating stages

: To make optimum combustion under every operating stage, ECU should calculate proper injection volume ir each stage by considering various factors.

•Starting injection volume control

:During initial starting, injecting fuel volume will be calculated by function of temperature and engine cranking speed. Starting injection continues from when the ignition switch is turned to ignition position to til the engine reaches to allowable minimum speed.

Driving mode control

If the vehicle runs normall, fuel injection volume will be calculated by accelerator pedal travel and engine rpn and the drive map willbe used to match the drivers inputs with optimum engine power.

![](images/ed61873dfa8eb2a5b0cb774757dd95900e58494544650d9b0e36fdba225e4d86.webp)


### ECU - Removal and Installation
1. Flip up the front passenger's seat and remove the ECU cover nuts.   
2. Remove the ECU bracket nuts.

3. Unscrew the ECU connect bolt and remove the ECU assembly.

![](images/9b260ab476df9c96d06ac8c25addaf263e18b15b341cf01a69b19ce8662d8a79.webp)

4 Install in the reverse order of removal.

5. Backup the below data with Scan-i when replacing the ECU.

- Current ECU data   
-Vehicle Identification Number (VIN)   
-Variant coding data   
- Then, input the data into new ECU. For immobilizer equipped vehicle, additional coding operation is necessary.

![](images/28f63bc02280f92f0b8021c6a47a33de04ff691c9281ff53ce405d5d52a4dcb0.webp)


### Fuel Pressure Control Elements
Pressure control consists of 2 principle modules.

•Determines rail pressure according to engine operating conditions. Controls IMV to make the rail pressure to reach to the required value

Pressure in the fuel railis determined according to engine speed and load on the engine. The aim is to adapt th injection pressure to the engine's requirements.

•When engine speed and load are high   
The degree of turbulence is very great and the fuel can be injected at very high pressure in order to optimize combustion.   
•When engine speed and load are low :The degree of turbulence is low. Ifinjection pressure is to high, the nozzle's penetration wil be excessive and part of the fuel willbe sprayed directly onto the sides of the cylinder, causing incomplete combustion. So there occurs smoke and damages engine durability.

Fuel pressure is corrected according to air temperature, coolant temperature and atmospheric pressure and to take account of the added ignition time caused by cold running or by high altitude driving. A special pressure demand is necessary in order to obtain the aditional flow required during starts. This demand is determined according to injected fuel and coolant temperature.


### Fuel Pressure Control
Rail pressure is controlled by closed loop regulation of IMV. A mapping system – open loop — determines the current which needs to be sent to the actuator in order to obtain the flow demanded by the ECU. The closed loop wil correct the current value depending on the difference between the pressure demand and the pressure measured.

If the pressure is lower than the demand, current is reduced so that the fuel sent to the high pressure pump is increased.   
If the pressure is higher than the demand, current is increased so that the fuel sent to the high pressure pump is reduced.

![](images/01a638006dfd6dab95515e7e09ad7a63c8982b0cab229947276413916998805b.webp)

Y220_08008

![](images/74fc346240c9e92e549b2a92553b49b5be03cce7c8fa06b7bc4d9cc6352f51db.webp)


### Fuel Injection Control
Injection control is used in order to determine the characteristics of the pulse which is sent to the injectors.   
Injection control consists as below.   
Injection timing   
Injection volume   
Translating fuel injection timing and injection volume into values which can be interpreted by the injector driver. -a reference tooth (CTP) -the delay between this tooth and the start of the pulse (Toff) - the pulse time (Ton)


### Main injection timing control
The pulse necessary for the main injection is determined as a function of the engine speed and of the injected flow.

The elements are;

•A first correction is made according to the air and coolant temperatures. This correction makes it possible to adapt the timing to the operating temperature of the engine. When the engine is warm, the timing can be retarded to reduce the combustion temperature and poluting emissions (NOx). When the engine is cold, the timing advance must be sufficient to allow the combustion to begin correctly.   
•A second correction is made according to the atmospheric pressure. This corection is used to adapt thetiming advance as a function of the atmospheric pressure and therefore the altitude.   
•A third correction is made according to the coolant temperature and the time which has passed since starting. This correction allows the injection timing advance to be increased while the engine is warming up (initial 0 seconds). The purpose of this corection is to reduce the misfiring and instabilities which are liable to occur after a cold start.   
•A fourth correction is made according to the pressure error. This correction is used to reduce the injection timing advance when the pressure in the rail is higher than the pressure demand.   
•A fifth correction is made according to the rate of EGR.

This corection is used to corect the injection timing advance as a function of the rate of exhaust gas recirculation. When the EGR rate increases, the injection timing advance mustin fact be increased in order to compensate for the fall in termperature in the cylinder.

During starting, the injection timing must be retarded in order to position the start of combustion close to the TDC. To do this, special mapping is used to determine the injection timing advance as a function of the engine speed and of the water temperature. This requirement only concerns the starting phase, since once the engine has started the system must re-use the mapping and the corrections described previously.


### Pilot injection timing control
The pilot injection timing is determined as a function of the engine speed and of the total flow.

The elements are;

•A first correction is made according to the air and coolant temperatures. This correction allows the pilot injection timing to be adapted to the operating temperature of the engine.   
•A second correction is made according to the atmospheric pressure. This corection is used to adapt the pilot injection timing as a function of the atmospheric pressure and therefore the altitude.

During the starting phase, the pilot injection timing is determined as a function of the engine speed and of the coolani temperature.

![](images/dfc90a10759fa2f8ce6500ae1d788932186e549eba6754e27a8c49073ac594c1.webp)


### Main Flow Control
The main flow represents the amount of fuelijected into the clinder during the main injection. The pilot flow represents the amount of fuel injected during the pilot injection.

The total fuel injected during 1 cycle (main flow + pilot flow) is determined in the following manner.

: The driver's demand is compared with the value of the minimum flow determined by the idle speed controller.

When the driver depress the pedal, t is his demand which is taken into account by the system in order to determine the fuel injected.   
When the driver release the pedal, the idle speed controller takes over to determine the minimum fuel which must be injected into the cylinder to prevent the enigne from stalling.

It is therefore the greater of these 2 values which is retained by the system. This value is then compared with the lower flow limit determined by the ASR trajectory control system. As soon as the injected fuel becomes lower than the flow limit determined by the ASR trajectory control system, the antagonistic torque (engine brake) transmitted to the drive wheels exceeds the adherence capacity of the vehicle and there is therefore a risk of the drive wheels locking. The system thus chooses the greater of these 2 values (main flow & pilot flow) in order to prevent any loss of control of the vehicle during a sharp deceleration.

This value is then compared with the flow limit determined by the cruise control. As soon as the injected fuel becomes lower than the flowlimit determined by the cruise control, the vehicle's speed flls below the value required by the driver. The system therefore chooses the greater of these 2 values in order to maintain the speed at the required level.

This valve is then compared with the flowlimit determined by the flowlimitation strategy.This strategy allws the flow to be limited as a function of the operating conditions of the engine.The system therefore chooses the smallr of these 2 values in order to protect the engine. This value is then compared with the fuelimit determined by the ASR trajectory control system.

As soon as the injected fuel becomes higher than the fuel limit determined by the ASR trajectory control system, the engine torque transmitted to the wheels exceeds the adhesion capacity of the vehicle and there is a risk of the drive wheels skidding.The system therefore chooses the smaller of the two values in order to avoid any loss of control of the vehicle during accelerations.

The anti-oscilation strategy makes it possible to compensate for fluctuations in engine speed during ransient conditions. This strategy leads to a fuel correction which is added to the total fuel of each cylinder. The correction is determined before each injection as a function of the instantaneous engine speed.

A switch makes it possible to change over from the supercharge fuel to the total fuel according to the state of the engine •Until the stating phase has finished, the system uses the supercharged fuel. •Once the engine changes to normal operation, the system uses the total fuel

The main fuel is obtained by subtracting the pilot injection fuel from the total fuel.

A mapping determines the minimum fuel which can control an injector as a function of the rail pressure. As soon as the main fuel flls below this value, the fuel demand changes to O because in any case the injector is not capable of injecting the quantity demand.

![](images/875c05dae2c45a02919818ec17866bd0da88d74a88500fc6a970741a2aa45cee.webp)

![](images/8245528cdaedebe1d097095098e2406175318d032e1d52565fde9901617183ce.webp)

Y220_08009


### Driver Demand
The driver demand is the translation of the pedal position into the fuel demand. Itis calculated as a function of the pedal position and of the engine speed. The driver demand is fitered in order to limit the hesitations caused by rapid changes of the pedal position. A mapping determines the maximum fuel which can be injected as a function of the driver demand and the rail pressure. Since the flow is proportional t the ijection time and to the square rootof the injection pressure, it is necessary to limit the flow according to the pressure in order to avoid extending the injection for too long into the engine cycle. The system compares the driver demand with thi imit and chooses the smallr of the 2 values. The driver demand is then corrected according to the coolant temperature. This correction is added to the driver demand.

![](images/650a4b4e9c857cd9fed78fa94c8b07090a56492159214a4259ffc9ca89d2a08e.webp)


### Idle Speed Controller
The idle speed controller consists of 2 principal modules:

The first module determines the required idle speed according to:

-The operating conditions of the engine (coolant temperature, gear engaged)   
- Any activation of the electrical consumers (power steering, air conditioning, others)   
-The battery voltage   
-The presence of any faults liable to interface with the rail pressure control or the injection control. In this case, the accelerated idle speed is activated to prevent the engine from stallng when operating in degraded mode. - It is possible to increase or to reduce the required idle speed with the aid of the diagnostic tool.

The second module is responsible for providing closed loop control of the engine's idle speed by adapting th minimum fuel according to the difference between the required idle speed and the engine speed.


### Flow Limitation
The flowlimitation strategy is based on the following strategies:

•The flow limitation depending on the filing of the engine with air is determined acording to the engine speed and the air flow. This limitation allows smoke emissions to be reduced during stabilized running.   
The flow limitation depending on the atmospheric pressure is determined according to the engine speed and the atmospheric pressure. It allows smoke emissions to be reduced when driving at altitude.   
The full load flow curve is determined according to the gear engaged and the engine speed. I allows the maximum torque delivered by the engine to be limited.   
A performance limitation is introduced if faults liable to upset the rail pressure control or the injection control are detected by the system. In this case, and depending on the gravity of the fault, the system activates: - Reduced fuel logic 1: Guarantees 75 % of the performance without limiting the engine speed. -Reduced fuel logic 2: Guarantees 50 % of the performance with the engine speed limited to 3,000 rpm. - Reduce fuel logic 3: Limits the engine speed to 2,000 rpm.

The system chooses the lowest of all these values.

A correction depending on the coolant temperature is added to the flow limitation. This correction makes it possible to reduce the mechanical stresses while the engine is warming up. The correction is determined according to the coolant temperature, the engine speed and the time which has passed since starting.


### Superchager Flow Demand
The supercharge flow is calculated according to the engine speed and the coolant temperature. A correction depending on the air temperature and the atmospheric pressure is made in order to increase the supercharge flow during cold starts. It is possible to alter the supercharge flow value by adding a flow offset with the aid of the diagnostic tool.


### Pilot flow control
The pilot flow represents the amount of fuel ijected into the cylinder during the pilot ijection.This amount is determinec according to the engine speed and the total flow.

•A first correction is made according to the air and water temperature. This corection alows the pilot flow to be adapted to the operating temperature of the engine. When the engine is warm, the ignition time decreases because the end-of-compression temperature is higher. The pilot flow can therefore be reduced because there is obviously less combustion noise when the engine is warm.   
A second correction is made according to the atmospheric pressure.   
This corection is used to adapt the pilot flow according to the atmospheric pressure and therefore the altitude.   
During starting, the pilot flow is determined on the basis of the engine speed and the coolant temperature.

![](images/607451ab4adf93848a2b388ea4b5d75b95716f70cc6f70fb1daa25186ddd870e.webp)


### Balancing of the point to point flows
The pulse of each injector is corrected according to the difference in instantaneous speed measured between 2 succes.   
sive injectors.   
• The instantaneous speeds on two successive injections are first calculated.   
•The difference between these two instantaneous speeds is then calculated.   
Finally, the time to be added to the main injection pulse for the different injectors is determined. For each injector, this time is calculated according to the initial ofset of the injector and the instantaneous speed difference.


### Detection of an injector which has stuck closed
The cylinder balancing strategy also allows the detection of an injector which has stuck closed.The diference in instantaneous speed between 2 successive ijections then exceeds a predefined treshold. In this case, a fault is signaled by the system.


### Resetting the pilot injection
The accelerometer is used to reset the pilot injection flow in closed loop for each injector. This method allows the correction of any injector deviations over a period of time. The principle of use of the accelerometer is based on the detection of the combustion noises.

The sensor is positioned in such a way as to receive the maximum signal for all the cylinders. The raw signals from the accelerometer are processed to obtain a variable which quantifies the intensity of the combustion. This variable, known as the ratio, consists of the ratio between the intensity of the background noise and the combustion noise.

A first window is used to establish the background noise level of the accelerometer signal for each cylinder. This window must therefore be positioned at a moment when there cannot be any combustion. The second window is used to measure the intensity of the pilot combustion. Its position is such that only the combustion noises produced by the pilot injection are measured.It is therefore placed just before the main injection.

The accelerometer does not allow any evaluation of the quantit injected. However, the pulse value wil be measured when the injector starts injection and this pulse value is called the MDP (Minimum Drive Pulse). On the basis of this information, it is possible to effciently correct the pilt flows.The pilt ijection resetting principle therefore consists of determining the MDP, in other words the pulse corresponding to the start of the increase in value of the ratio (increase of vibration due to fuel combustion).

![](images/82b733e24145b427527d04bb3e1780f933bf3029cb1c23cb7d334eca58bace22.webp)

![](images/3d1aa7e9c7730f5e95c2d4d22cdc4bfbc27489456dcc5f7d176beee2248b3dc1.webp)

This is done periodically under certain operating conditions. When the reseting is finished, the new minimum pulse value replaces the value obtained during the previous resetting. The first MDP value is provided by the C2I. Each resetting then allows the closed loop of the MDP to be updated according to the deviation of the injector.


### Detection of leaks in the cylinders
The accelerometer is also used to detect any injector which may have stuck open. The detection principle is based on monitoring the ratio. f there is a leak in the cylinder, the accumulated fuel selfignites as soon as the temperature and pressure conditions are favorable (high engine speed, high load and smalleak).

This combustion is set off at about 20 degrees before TDC and before main injection.

The ratio therefore increases considerably in the detection window. It is this increase which allows the leaks to be detected. The threshold beyond which a fault is signaled is a percentage of the maximum possible value of the ratio. Because of the severity of the recovery process (engine shut-down), the etection must be extremely robust.

An increase in the ratio can be the consequence of various causes:

Pilot injection too strong •Main combustion offset Fuel leak in the cylinder

If the ratio becomes too high, the strategy initiall restricts the pilot injection flow and retards the main injection. f the ratio remains high despite these interventions, this shows that a real leak is present, a fault is signaled and the engine is shut down.


### Detection of an accelerometer fault
This strategy permits the detection of a fault in the sensor or in the wiring loom connecting the sensor to the ECU. It is based on detection of the combustion. When the engine is idling, the detection window is set too low for the combustion caused by the main ijection. If the ratio increases, this shows that the accelerometer is working properly, but otherwise a fault is signaled to indicate a sensor failure. The recovery modes associated with this fault consist of inhibition of the pilot injection and discharge through the injectors.

![](images/9b25fabb66a9ab2f844cfb18f0a6e82a89cfeb5ea036f8a086e8ce866deb87a5.webp)


### INDIVIDUAL INJECTOR CALIBRATION (C2I)
Injected fuel is proportional to square root of injection time and rail pressure.

It is function between pulse and rail pressure and fuelinjection curve is called injector characteristis curve having the following shape.

![](images/6b8e4a5c40c1caa43443d828d2ef0e59eddb3dbc2fa31e5fb0836cca02df3fb0.webp)

Y220_08012

fommon rail njectors are very accurate components. They are able to inject fuel delivery between 0.5 to 100 mg/str inder pressure varying from 150 to 1600 bar.

This high level of accuracy requires very low machining tolerances (few zm).

Nevertheless, due to the machining dispersion, the loss of charge through the functional orifices, the friction between moving parts and electromagnetic field level are different from one injecto to the other. So, the difference of fuel delivery for the same pressure and the same pulse can reach 5 mg/str from one injector to the other.  is impossible to control eficiently the engine with such a dispersion between the different injectors. I is necessary to add a correction that allows injecting the demanded fuel delivery whatever the initial hydraulic characteristics of the injector is. The method consists in corecting the pulse that is applied to the injector with an offset that depends on the initial hydraulic map of the injector. So, the pulse should be corrected according to characteristics of each injector.

![](images/c1c046b011da0830a7a2915a92d2f4af01c4b57a39d9d366f7f907006fdabd7e.webp)

C2I is composed of models on these characteristics of injectors.

C2I consists of 16-digit; composed of numbers from 1 to 9 and alphabets from A to F. ECU remembers C2I, characteristics of each injector, to make the most optimal fuel injection.

When replacing the injector, C2I code on the top of new injector should be input into ECU because the ECU is remembering the injector's C2l value. If C2 is not input, engine power drops and occurs irregular combustion. When ECU is replaced, Cl code of every injector should be input. If not, cannot accelerate the vehicle even when the accelerator pedal is depressed.

![](images/3ee0e474f6b7401ee5d475185185b160f19e5b7b5a2dda0f53ab9d0e3067a69e.webp)

Y220_08013

![](images/c22e1f3f3c12447a00aa156331f13b5d10906035192e71a3a44b354997b88da3.webp)


### MINIMUM DRIVE PULSE (MDP) LEARNING
When the pulse value that the injector starts injection is measured, itis called mininum drive pulse (MDP). Through MDP controls, can correct pilot injectionseffectively. Pilot injection volume is very smal, 1 \~ 2 mm/str, so precise control of the injector can be difficlt fit gets old. So there needs MDP learning to control the very small volume precisely through learning according to getting older injectors.


### Learning Conditions
![](images/6de2f60be55e16d73309d37aad93124616823e1cf6318b96ea7625719b78888c.webp)


### Trouble Codes
![](images/efb3acf836d5d90977525a87d28ebfe49b386999023054883fd1f33f58083eba.webp)

![](images/a6b45f7b90c335ce71c6aae55d61cfa1dd4831e3c168db5fdaf56b3af26b17e6.webp)


### Accelerator Pedal Sensor
![](images/2650baa2e26980e171ae37cc77567252b552db4cb52c49b229d26013c97d4a0a.webp)

![](images/dc60776cf3e6041b84a02b23973259ee28013021b7e18796605e1bd9cda23fc4.webp)


### <When depressing the accelerator pedal and brake pedal simultaneously>
Y220_08014

Accelerator pedal sensor changes accelerator pedal position into electrical signal and then sends to ECU to let know the driver's demand. There are 2 sensors in the accelerator pedal sensor. Accelerator pedal No.1 (ACC 1) sensor signal determines fuelinjection volume and injection timing during driving, and accelerator pedal No. 2 (ACC ) sensor signal compares whether the No. 1 sensor signal value is correct.

If accelerator pedal No. 1 and 2 sensors are defective, ECU remembers defect code, and acceleration responses are getting bad and engine rpm hardly increases.


### Notice
When depressing the accelerator pedal and brake pedal simultaneously while driving, the acceleration response willbe diminished abruptly and cannot drive with over 70 km/h even though depressing the accelerator pedal to its end. At this time, the trouble code of “P-1124 Accelerator pedal sensor stuck” is stored into ECU. If depressing the accelerator pedal over 3 times, it will be resumed to normal condition.

\* For detailed information, refer to "Diagnosis" section in this manual.

![](images/da2e5260f1f4fdad19340d5db09d45b427778d9f303c5c42fbb01be92b67de7b.webp)  
<Circuit diagram of Accelerator pedal sensor>

![](images/c7f017a6dd5d4f6dd35cdb831b826ae6e3ecfd57f83e89ef79c2a47cc9a5dac2.webp)


### Coolant Temperature Sensor
![](images/9922d002a2f57b5d0a6d6259677c7a67c2d6ec911fe282b1825b7262766af4b6.webp)

Coolant temperature sensor is a NTC resister that sends coolant temperature to ECU.

NTC resister has characteristics that i the engine temperature rises, the resistance lowers so the ECU detects lowering signal voltages.

If the fuel jected into the engine through ijector has more turbulence, then combusts very well However, i engine temperature is too low, the fuel injected as foggy state forms big compounds causing incomplete combustion. So the sensor detects coolant temperature and changes coolant temperature changes into voltage then sends to ECU to increase the fuel volume during cold start for better starting. And detects engine overheating for fuel volume reduction to protect the engine.

ECU functions as below with coolant temperature sensor signals.

•When engine is cold, controls fuel volume to correct idle speed.   
•When engine is overheated, controls electrical fan and A/C compressor to protect the engine.   
•Sends information for emission control.

![](images/27011c7404cf4247c8435b14ac0a7dfedf4182beeaea927c453278cd057d3e79.webp)

![](images/551748b1ab0652487d30c8fa98ae5f5bcb4526793ef28aa40da38a371900d148.webp)

Y220_08017

![](images/9b3388de70447c838f2f6bb0dc4f9efea3fc88a2139bdeb21db86d4f63e75a5d.webp)


### Boost Pressure Sensor
![](images/52f17a3b53587f2ef2889e9723d3f7240052c62ce797e01492a46d590a026906.webp)

Y220_08018

Boost pressure sensor uses piezo element and uses only 3 terminals out of 6.   
It sets fuel injection timing and corrects fuel injection volume according to atmospheric pressure.   
The other function is determining EGR operation stops.

• Output voltage calculation V = Vs x(P x 0.004 - 0.04) Vo : Output voltage Vs : Supply voltage P : Applying voltage

![](images/6697f44f7579697a2fcf289d369d792dff639e2389d838b6ebd30c7840f2eae1.webp)

![](images/53477ea217191e471f9c5cbaf66dddaf2bb11f9a159d4e4a56429f1d0cb45d6b.webp)

![](images/464896dc28d82122ca47550caf1fe44a882517d98d7b9b57b6db0f56485f8651.webp)

![](images/2ed9a807d781610c72a32458f488aafee5cb59d4287a3c6127015e720c9e2468.webp)

Y220_08020


### Vehicle Speed Sensor
The ABS or ESP control unit sends the vehicle speed signals to ECU. ECU uses these signals to calculate the vehicle speed and meter cluster shows signals as vehicle speed.


### Function
-Limits idle control correction duty range - Controls cooling fan - Cuts fuel injection if exceeds max. speed -Controls vehicle shifting feeling - Used for exhaust gas control mode

![](images/a1481e83a7a5fba4e5a069d5e1ef9b9593b24c12a66c7a229951d148ddac547d.webp)

![](images/e3fb7f360dd3c6323827c86e91669bc4be8b3d06f4ee0cea84dff63ffd86954b.webp)


### Barometric Pressure Sensor
It is builtin the ECU and detects absolute pressure of atmosphere to correct fuel injection timing and injection volume according to altitude.


### Brake switch
Brake switch detects brake pedal operations and then sends to engine ECU. It has dual structure with 2 combined switches and there are brake switch 1 and 2. When these 2 signals are input, engine ECU recognizes as normal brake signals. These switch signals are related with accelerator pedal sensor operations and used to control the fuel volume during braking. It means there are no problems in operating accelerator pedal when the brake pedalis operated but the fuel volume reduces if operates brake pedal while the accelerator pedal is depressed.

![](images/34ca181a5628766914332b762054cd827b4a86bcaeb16446b6350f0bb39ac9d2.webp)

Y220_08022


### Clutch pedal switch
Clutch pedal switch is installed on the upper of the clutch and sends clutch pedal operations to engine ECU. Contact type switch allws engine ECU to recognize the shifting points to correct the fuel volume. It means it corrects fluctuation happens during gear shifting. Another diffrent function is canceling auto cruise function if equipped (auto cruise control - equipped for export).

![](images/b31be5b6d052446fd896307016fb0dad04125726884454d960f1875c36d3141c.webp)

![](images/69eb1148b53ff83aa730bfc7a937c749e651ae893ff9e2e84131679fba902df9.webp)

SECTION DI09


### ELECTRIC DEVICES AND SENSORS .. 0-3
Sensors in engine compartment. DI09-3   
Electric devices in engine compartment . DI09-4   
Specifications . DI09-5   
Circuit diagram of preheating system.. DI09-6   
Circuit diagram of starting and alternator DI09-7


### TROUBLE DIAGNOSIS ... ... I09.8
General. DI09-8   
Alternator. DI09-10   
Starter .. DI09-12   
Preheating system . DI09-14   
Preheating time relay. DI09-16   
Glow plug . DI09-17


### SPECIAL TOOLS AND EQUIPMENT .. DI09-19
![](images/0b57f7f1e195a92095ba4cad831c7c9b4227797da8611bc8a353c6d7c8c4a35d.webp)


### SENSORS IN ENGINE COMPARTMENT
![](images/980b4d22f9c3283019c9be9d91514e07c30e8f15f529a7fd7feb5cb3963739bd.webp)

![](images/353254aa712747fc83d45543172338149d1ed1485351f40968b71fd33c815fc1.webp)

![](images/d26768b6e728f9ca6fcec30e51556f592c70b88fe99a1f305913d040304ac01f.webp)

![](images/76469d07d6a0e7d56137aac7e6772c4e34dbbd13e953c4302c71c3f1097af189.webp)


### SPECIFICATIONS
![](images/96e8e779e2113ff2e190061504284acf76da0d69fa8d9362b8292e1bb1201d90.webp)

![](images/2c1b3cb3db12bc0f910bd68317c1d614073fe6572b9bf696e491cb29370b5593.webp)


### CIRCUIT DIAGRAM OF PREHEATING SYSTEM
![](images/5e7cf858d89cf4ed9d9fba4c9744b8a499fcdf31b5c845fabe1312fe9b8d23dd.webp)

Y220_09003

![](images/8969f1441adad93d1908d39d7e58000c2daf17a6f4db313b10fe951b848ead4f.webp)


### CIRCUIT DIAGRAM OF STARTING AND ALTERNATOR
![](images/d052be361c269e0ca6f57013584a118d3c4b19f914a82de1b1577b7edcfd8a38.webp)

Y220_09004

![](images/a9f18bfafdd75d6699b6313e09a383c3a190522692155c14ed5d273c84e91c46.webp)

![](images/c0a2c3ee282c70a36e7c60e411307ccd1c3d44ee4d2eab9aa19be9480f10dce0.webp)

![](images/e8b5c73ca1b970639a68ed25522d89adfdebe260b3c13bd5de2bfd0e79a425f0.webp)

![](images/4d94e27700bd38a171d78a4b15db4526fdd924a4eafe359fa8cc0830d73b560b.webp)

![](images/b37d9114b75f2e41480cbfee9c5a2f2c90a46525906b1630c9e06e9dd33016e2.webp)

![](images/4cf7e555953f857635160994d2edd0a4c43653046f35ecbfeed8d38b7b1d67db.webp)


### ALTERNATOR
![](images/df887a1d3d827b85caeec32f71a8bc4664fc280c60165b9eb828ca83a10650d4.webp)

Y220_09005

1. Cooling fan 3. Alternator   
2. Bolt .. 45 Nm 4. Plug connection

![](images/64f414f46f3ad72a9d65a64b058d1bef9e94dbe5d094961cc13e3384ea2f67e0.webp)


### Removal and Installation
1. Disconnect the negative battery cable.   
Remove the plug connection.

3. Unscrew the bolts and remove the alternator. Installation Notice

![](images/63542487d6a5d7850224e4fae244d1ab9daf1bf724ef73322003f3a24c6899bd.webp)

4 Install in the reverse order of removal.

![](images/e72698bc3998ccfcf9f2c4ca1d1b3e2188226847c9ea8157a1adeec79a98e26b.webp)

![](images/11d8eafd059f378f0ad3afd1a4606ca1b3c9ecf60f99daabf378431326e45cf9.webp)


### STARTER
![](images/ceac442e9ccf9700243c06e75f6ace72442fdc485e8a460c784e716d644be12a.webp)

1. Starter   
2. Washer   
3. Nut .. . 15 Nm   
4. Bolt .. .48 Nm

![](images/8db87ed16076fdef3ac2027dce350627602592d7a0f19e879d515907a51b9ec5.webp)


### Removal and Installation
1. Disconnect the negative battery cable.   
2. Disconnect the starter terminal.

3. Lift up the vehicle and remove the front propeller shaft mounting bolts.

![](images/938ce599512c695c390ec1fc3ce11e6466160a5e38678d0a5dddb5912aa0f0d5.webp)

Remove the upper and lower mounting bolts.

5 Install in the reverse order of removal.

![](images/a54ae396272ea564c5f477a6201698b86e5aa3d5820a3638f636e1789dcea998.webp)


### General
Glow plug is installed on the cylinder head (combustion chamber) in the D27DT preheating control unit system. Colc starting performance has improved and exhaust gas during cold starting has reduced.

ECU receives coolant temperature and engine speed to control; after monitoring the engine preheating/after heating anc glow plug diagnosis function, the fault contents will be delivered to ECU.

•Engine preheating/after heating functions   
•Preheating relay activation by ECU controls -Senses engine temperature and controls the preheating/after heating time -Preheating warning light   
•K-LINE for information exchanges between preheating unit and ECU - Transmits preheating unit self-diagnosis results to ECU -Transmits glow plug diagnosis results and operating status to ECU

![](images/aa2ee767e2a9ba4154d4d980e3519ff5225d85958660a550e55389c374548808.webp)

Y220_09012

![](images/e059bdcdb52668e54eb6fcab95d46d662d79f6ac4566eb2bc8ed7df6a957f445.webp)


### Function
Preheating system controls and checks following functions and operating conditions.

Pre-Heating

The power wil be supplied to the glow plugs by ECU controls when the power is supplied to the IG terminal from the batery and there are normal communications with ECU within 2 seconds. The surface of glow plug will be heated up to 850°C very quickly to aid combustion by vaporizing air-fuel mixture during compression stroke. Preheating time is controlled by ECU.

•While engine starting : Help to warm up engine

After-heating

When the engine is started, after-heating starts by ECU controls. The idle rpm wil be increased to reduce toxic smoke, pollutants and noises. After-heating time is controlled by ECU.

• Checking glow plugs

- Check each glow plug for short in circuit - Check each glow plug for open in circuit due to overvoltage - Check glow plug for short to ground

•Forceful relay shut-down - When glow plug is shorted to ground •K-Line communication

-ECU sends the results to preheating time control relay through K-Line to start communication.   
-Preheating time control relay sends messages including self-diagnosis data for glow plugs to ECU.   
- Glow plug makes communication only as response to demand.   
-  When power is supplied, ECU starts self-diagnosis within 2 seconds.   
-Under the following conditions, communication error occurs. When there is no response from glow plug module within 2 seconds When an error is detected in checksum Less byte is received Error code of “Pre heating control communication fail” will be reported.

![](images/6aa81007d3093f15c5b4b9b225b15e46b297b77fead6238a3080c27da6bc718f.webp)


### PREHEATING TIME RELAY
Structure

![](images/d3e27484ee809c20e8c07670aefe7f6b2d40ab212176ed393409c586931a3e10.webp)

Y220_09013


### Specifications
![](images/3994a2b221b7d496404ea816463b254b96faa1245103cfd704277a0c67192261.webp)

![](images/245ed87bbd392ca99e601132196fe0a4e4e13610f7c187de7614c3e8248e4738.webp)


### GLOW PLUG
Cylinder type glow plug is inserted into the cylinder and composed of heating pin and housing.

There are heating coil and control coil in the heating pin and those coils located inside of ceramic cover turn ON or OFF the internal switch.


### Purposes of use
-Preheating before engine starting -During engine starting -After-heating after engine starting

![](images/ace80714f31cfa3204a6f5fce0882dca5c01292d663028a81d91fb874ce5e653.webp)


### Conditions for glow plugs
-Prompt heating and secured temperature stabilities (temperature changes) in low operating voltage   
-Should not exceed permissible max. temperature under max. operating voltage   
-Heating pin should have good heat-resisting properties against combustion gas and durability   
-Material of the glow plug should meet high stressing conditions (e.g., temperature, vibration and environmental factors)


### Specifications
![](images/77ebd2ff39aeccefff62fffa3c98d41fb1553788b9a9c747c7779146fba91cfe.webp)


### Trouble Code
Refer to “Diagnosis” section in this manual.

![](images/78740033495e99657e32907bfe9dad32e8c6188ad47a1356a54bee609f0ab622.webp)

![](images/a7b39257df997bf6b9025e7112ae23ce2215f1cb88dfc8aa64381d301586820c.webp)


### Removal and Installation
1.Turn the ignition switch to “OFF” position and disconnect the negative battery cable. . Set aside the harnesses on the cylinder head.

3. Disconnect the glow plug connectors and loosen the glow plugs.

Installation Notice

![](images/740336d937717c5dbc98884b51f3eb6febb4cb0ef7e81e6c79b5061f84b409ea.webp)

4.Remove the glow plugs from the cylinder head with a special tool. Plug the openings of the glow plugs with sealing caps.

![](images/516e26ef467ee9d9353d0cb274cf4b176b31fa41b34baf55df5ddcef089830cb.webp)


### SPECIAL TOOLS AND EQUIPMENT
![](images/52a0dcc6de5c032e2f52f2845f74b87f1588a64f10fd8892707189ee8a946ab9.webp)

![](images/fb8545e64a8351fa957e37104e3387f2b89f790ee73e125e90e74467d66b934e.webp)

![](images/f6bf692dcdcbe49b05cc342908b7ad6b574e0986c86176dfeea25246ca8bc95a.webp)


### Table of Contents
SCAn- OPERATING PROCEDURES - XDi270 ENGINE ... 1103 TROUBLE DIAGNOSIS TABLE . DI10-23 FUEL SYSTEM DIAGNOSIS .. . DI10-177

![](images/55a12d7cc9427395f8574189521d6455464564df41a85650cbefb55b15b3af59.webp)


### SCAN-I OPERATING PROCE-DURES XDi270 ENGINE
ENTENG MIAGNOSMS PROCEDURES. DI10-4   
FUNCTION SELECTION .DI10-6   
Check the trouble code DI10-6   
Sensor data check. DI10-7   
Actuator check . DI10-8   
Trouble code clear. DI10-10   
ECU identification. DI10-12   
Injector coding (C2I) DI10-13   
Leak detection DI10-15   
Variant coding . DI10-16   
ECU replace . DI10-18

![](images/84f6712ed9aefe718f0c0e180b21e7b92a10c5c1c96639e34c99d666664b61e1.webp)


### SCAN-I OPERATING PROCEDURES - D27DT ENGINE
![](images/c408faa3c44d4d41b417004451399d947b3e7cb363515fe2eb960fd83c98160d.webp)


### ENTERING DIAGNOSIS PROCEDURES
1Select “1] DIAGNOSIS”" and press “EntER" in “MAIN MENU" screen.

![](images/1478a1df3e6194a36ea32702b43559028022028a6011e9983d53f752bb15506f.webp)

2. Select “5] REXTON" and press "EnTER" in "VEHICLE SELECTION" screen.

3. Select “1] ECU" and press “(EntER" in “CONTROL UNIT SELECTION” screen.

− SCAN - 100 CONTROL UNIT SELECTION   
REXTON ECU   
01] ECU 08] HUBER EGR   
02] TCU 0 SSPSs   
03] ABS 10 S LEVEER   
04] AIR-BAG 1 F   
05 TODD   
06] TCCU(PartTime)   
07] IMMOBILIZER Select one of the above items Y220_10003

![](images/4ed35ced74fa4431a0beadb2c46fa832d951e7d1891a5d167ccb3b49abb4c3aa.webp)

4. Select "4] XDi 270” and press "EntEr" in “MODEL SELECTION” screen.

![](images/93dfc8ddeb4a5fe545246127ec5e7bcb6ff42cb28e97f67aacff4640a6e3ffdd.webp)

5The “FUNCTION SELECTION” screen is displayed.

SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10005

![](images/0f1e49b7bc86bae44b60c7f991b6cf26e2768562e5599ca786387fd91115f364.webp)

![](images/37d0486e1a826e3a823746308611eca5bbf3e3254eecff847ead6007666314d3.webp)


### FUNCTION SELECTION
Check the Trouble Code

Preceding work: Perform the “Entering Diagnosis Procedures"

![](images/c43c61500328baf566b78839cb526f101c07fa948a0016dd848c57d06d83a01d.webp)

1. Select “1] TROUBLE CODE” and press “ENTER” in “FUNCTION SELECTION” screen.

Q SCAN - 100 02 DIAGNOSTIC TROUBLE CODES C=Current, H=History   
REXTON ECU DSL D27DT   
C-P1534. #2 Heater Driver Open Circuit   
C-P1530. #1 Heater Driver Open Circuit   
H-P0108. Boost Pressure Sensor Open Select one of the above items Y220_10008

2. The “DIAGNOSTIC TROUBLE CODEs” screen is displayed and it shows the trouble.


> ℹ️ **Примечание:** If there is not any fault, “NO TROUBLE DETECTED" message appears.
>
> ![](images/5f1fa6fd0fc7e46b8454f7810cd674a8ae146d9e0378fc07e76b2eceea68fe16.webp)
>
> 3. When selecting a trouble code, then
>
> if you press "Ente": Displays the sensor data for the detected trouble (Freeze Frame Mode).   
> if you press"“He":Displays the help tips for the detected trouble.
>
> ![](images/df58d45cdd3761c7276272fa7dd740f9cfea3262b9ccb1f54fdb425a7de2f496.webp)


### Sensor Data Check
Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/3bb77ea175401ea93287119c281f18d61e513ec14d7ce09a97dd1eb9a9a4f117.webp)

Y220_10010

1. Select "2] DATA LIST” and press “EntER" in “FUNCTION SELECTION” screen.

![](images/b83792071c726e8e7f82908eff6a72d649bb766f544ca5d20266952b2468bdea.webp)

2. The screen shows approx. 54 sensor data.

SCAN - 100 DATA LIST   
44. PTC Relay(#2).. OFF   
RUiSe FF SWitCh.... ON   
4Cruise Safty SWitch... OFF   
47Cruise Accel Switch... OFF   
48. Cruise Decel SWitch... OFF   
49. Cruise Resume Switch.. OFF   
50. Rear Blower Switch.... OFF   
5 Glow Plug Lamp.. OFF   
52Check Engine Lamp... OFF   
53. Fuel Filter Water In.. OFF   
Fix Un Fix Init.   
Itm Item Menu Y220_10012

3. Select the items you want to see and press to freeze them.

Note You can freeze up to 5 items (\*: selected items).

SCAN - 100 DATA LIST   
\*1. Fuel TemPeraTUre.... 26[°C]   
2 Engine Block Noise 1.. 0   
\*13. Engine Block Noise 2.. 0   
Ijcted Fuel Quanty.mg/stk]   
21EGR Demand(MAP)... 0.0[%]   
2 Idle Target RPM... 832[RPM]   
30 Engine State... Stopped   
Engine Run Inhibited.. YES   
Clutch Switch. OFF   
33. Brake Light Switch... OFF   
Fix Un Fix Init. Spec.   
Itemm It emm Menu Disp. Y220_10013

![](images/0f81562810488082af0cd8b04efaf3a9ed6654502138977f50f6d084367a52e8.webp)

![](images/09a8eedd97acf04fd6753e766195fda5e2bf34e45b96c38f22fd6e5f18030342.webp)


### Actuator Check
Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/fb0cdd848b07581b1b78a4a8efdb4ad0b3fb170a93c79c3db47efdf64a404304.webp)

1Select “3] ACTUATOR" and press “EntER)" in “FUNCTION SELECTION" screen.

2.The screen shows 14 items. Select the item you want to see and press "ENTER".

е SCAN - 100 ACTUATOR SELECTION   
REXTON ECU DSL D27DT   
01] EGR VALVE 09] GLOW PLUG LAMP   
02] GLOW PLUG 10] IMMO. LAMP   
03] IMV VALVE 11] A/C RELAY   
04] VGT VALVE 12] PTC RELAY(#2)   
05] FAN(LOW) 1 PTC RELAY(#1)   
06] FAN(HIGH) 14] FUEL FILTER   
07] POWER RELAY   
08] ENG CHECK LAMP Select one of the above items Y220_10016

![](images/3edda95a54f2d66808eb7a80b67acee8dfe4f8822c5931dd70525e04d23e2dd8.webp)

![](images/ccc56d98f6ce3f18921ec722270becb47c620fa48c883b51946823d7df0fbae0.webp)

3. For example, if you select “02] GLOW PLUG” item and press “Enter”, the screen as shown in figure is displayed.

4. If you want to operate the glow plug relay, press “res"” key. The “OPERATING” message appears and the relay operation alarm sounds.

![](images/5b193d520fe6922380fe79ba1206174bd04b5ad009d87f3057c8ba60c63ce442.webp)

f you want to stop the operation press""key in keyboard.

![](images/b2e706c66ceb9893454d3bc41f413f3d00c8f0b6e015a365f28fde08ae2916ea.webp)

![](images/70f89deeee6457fd2977de9ba02f797e93d1e8a5c6f1b46ba9878db06aa02e2f.webp)

![](images/4f064f01241d565dc7aa1560b64d5c32fb9bb0ccfbc5d6c01de2177e4e8c9050.webp)


### Trouble Code Clear
Preceding Work: Perform the “Entering Diagnosis Procedures"

![](images/72d94aac2115afd26a45b3d7bbf4d97ba3a481984698bd37eddea341ef19182d.webp)

1. Select “1] TROUBLE CODE" and press “EmE" in “FUNCTION SELECTION” screen.

![](images/ac708a8683b2038ac8916a9df4877817de9b6b6d8cc9714215d99662d4ce97e5.webp)

2. The “DIAGNOSTIC TROUBLE CODEs” screen is displayed and it shows the trouble.

Note C = Current trouble, H = History trouble

![](images/9c12a41ab193b096d19084036389b694421af0825fe2c13be8760b9ec1b59ee0.webp)

![](images/e0055380d5891ffc431972247a827a584a3d381cd042da4bdb7cc5ad9b521459.webp)

3. Fix the trouble and go back to “1] TROUBLE CODE" screen and check if the trouble has been changed to “H (History trouble code)” code.

4. If the trouble has been change to “H (History trouble code)" code, press « ESC key to go back to “FUNCTION SELECTION” screen. In this screen, select “4] TROUBLE CODE CLEAR" and preSs “EnTER)".

SCAN - 100 FUNCTION SELECTION   
REXToN ECU DSL D27DT   
1] TROUBLE CODE   
2 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10024

5. The “TROUBLE CODE CLEAR” screen is displayed. If you press "ENTE", only the history trouble codes will be cleared.


> ℹ️ **Примечание:** •Current trouble codes will not be cleared. •Check the trouble codes after clearing the trouble codes.
>
> ![](images/496a2899ca043328e580cdc71c87f3d85e058d74a80f905fbabb0749dd6db2f0.webp)
>
> ![](images/80f86c9de5550a94d5414f9cc2dd13580277c11716ec381d740b283ca1dc26a0.webp)
>
> ![](images/9b080c4848f843b790614b6d8eba04c67116eb2b97776e6d942ffa59318f5a58.webp)


### ECU Identification
Preceding Work: Perform the “Entering Diagnosis Procedures"

Q SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
21 DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10028

. Select “1] ECU IDENTIFICATION" and press "EnTER" in “FUNCTION SELECTION” screen.

![](images/d1ba38c3c43aae8ccf08f6911a982d3b4b3bc551806ae526fbca15c2dfe30e67.webp)

2 The “ECU IDENTIFICATION” screen that shows the VIN, ECU software number, ECU software version and programming date is displayed.

![](images/f5ed590a8fc77bfe930a4b85bb845e13245d717555826d8aae832ff176c6904c.webp)

![](images/f9937e87cd7573997468c579ce267b639f7ee342e395cb3b1625131edf24eda9.webp)

If you replaced the ECU, press “Enter” to input the vehicle identification number.


### Injector Coding (C2I)
Preceding Work: Perform the “Entering Diagnosis Procedures"


### Notice
If the injector/ECU has been replaced or the injector system defective is suspected, go to C2l Coding item and check the injector and coded injector C2l value.

1. Select “6] INJECTOR (C2I) CORRECTIONS” and press ENTER)" in “FUNCTION SELECTION" screen.

![](images/b05de921261edd4f9e02a54cc61743cfabe4e9786519073cd03047fe1bdb6bdb.webp)

![](images/aa082d8c38cfa22fd299ac0266985804129e7d40df3067729de9319df2c69ae0.webp)

2 The “INJECTOR (C2I) CORRECTIONS” screen that shows current C2l coding values of #1 to #5 injector is displayed. 3 If you replaced the ECU, enter the C2I value of the relevant injector.

SCAN - 100 INJECTOR(C2I) CORRECTIONS   
REXTON ECU DSL D27DT Programming Data : 2003-11-21 Tool Signature : 00 50 59   
#1 Inj. : B8 B9 D4 1B 41 C6 0E OF   
#2 Inj. : 80 CA A4 A6 4E 2A 92 54   
#3 Inj. : 08 CE 7C A6 4A 4A 74 33   
#4 Inj. : 60 AD 33 93 31 39 27 28   
#5 Inj. : C8 C6 7C E4 D1 FE D2 74 CONDITION : ENGINE IS NOT RUNNING   
[ENTER] : Display Write C2I Menu Y220_10033


> ℹ️ **Примечание:** •The C2l value of replacing injector is recorded in the label.
> •C2I coding number: 16 digits (ex, B1 B9 D4 1B 43 C6 OE 4F)
>
> ![](images/9d149542786ec7943773d536471c16a968bac3736fab2a8c536b1fd9ea91424d.webp)
>
> ![](images/b42b5466a7a74b2be2d4c15703a40934d6d18ba6a4c7c087219d90efd6de732c.webp)
>
> ![](images/86764db76ed7d34d1cf06d0974514fc2152f216ce88b1bfad149db1f229bd38e.webp)
>
> 3-1. If you enter the invalid C2l value of the relevant injector, the message as shown in figure appears with alarm sound.


> ℹ️ **Примечание:** If you want to go back to previous screen, press Es " key. You can see the previous C2I value.
>
> ![](images/796543cdb9cff866a500190cf1ce1cc4aca9bd3749f3e4e08903adc959065812.webp)
>
> 3-2. If you enter the valid C2I value of the relevant injector, the message as shown in figure appears with alarm sound.
>
> ![](images/e38ee82df69e4f4c8767f4bfcdcb9adefe9d4ae7357f4f4f8714d37d4a1a381c.webp)


> ℹ️ **Примечание:** This item is for checking the high fuel pressure after the IMV supply line of HP pump in DI engine fuel system. If you still suspect that the fuel pressure system is defective even after no trouble is detected, perform the fuel pressure test again by using a fuel pressure tool kit.
>
> 1. Select “7] LEAK DETECTION" and press “EnTER" in “FUNCTION SELECTION” screen.
>
> ![](images/e000458e6ad7a8c25877c8b607cac89aa35b9d9c8c14b7b03ae69ad3e6027a0d.webp)
>
> The “LEAK DETECTION" screen that shows the checking conditions as shown in figure is displayed.
>
> Q SCAN - 100 FUNCTION SELECTION   
> REXTON ECU DSL D27DT   
> 1] TROUBLE CODE   
> 2 DATA LIST   
> 3] ACTUATOR   
> 4] TROUBLE CODE CLEAR   
> 5] ECU IDENTIFICATION   
> 6] INJECTOR(C2I) CORRECTIONS   
> 7] LEAK DETECTION   
> 8] VARIANT CODING   
> 9] ECU REPLACE Select one of the above items Y220_10038   
> SCAN - 100 LEAK DETECTION   
> REXTON ECU DSL D27DT   
> > Test Condition <<<<<<<<   
> - Idle Running(Vehicle Speed = 0)   
> -Engine Temp. : 60-100°C   
> - No Detect Battery Fault   
> - No Detect Injector Drive Falut   
> -No Detect IV Drive Falut   
> - No Detect Rail Press Falut   
> [ENTER] : Start Leak Detection Y220_10040
>
> ![](images/25cfb697caa5ffcf4b71f71f8aab545d1aaf592cf0ad5c7437a4aa06429e51ea.webp)
>
> ![](images/0fd3a5b5b3949fbdc66b743dbe8846be5192d45d4965ba5eb7cfeaaf640c86ad.webp)


### Variant Coding
Preceding Work: Perform the “Entering Diagnosis Procedures"

1. Select “8] VARIANT CODING” and preSs “EntER)" in “FUNCTION SELECTION” screen.

Q SCAN - 100 FUNCTION SELECTION   
RExtoN ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C21) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10042

![](images/4e36d8a05e37957a8c5ae4b92b91d265136e43f9d1b278cf6f47312415091d45.webp)

2. When the "VARIANT CODING” screen is displayed, select “1] READ VARIANT VALUE” and preSs “EntER)".

3. The "VARIANT CODING” screen that shows currently equipped devices is displayed.

SCAN - 100 READ VARIANT VALVE   
Addit ion Heater(PTC) Yes   
Cruise Control No   
Immobilizer No   
Gear Box Type A/T   
Vehicle Speed Sensor No   
Emission Cycle Europe   
ABS/ESP Yes   
TOD/Part Time TCCU Yes   
Remote Start Engine Yes   
Programming Date : 2003-11-21   
Tool Signature : 00 50 59 Y220_10044

![](images/1d3143a2e7f5dfdf3dc5e34f344570c015a9b2c9315eadfff7105bc577de11ca.webp)

4. If you need to change the variant coding, press “ ESC " key to go back to “VARIANT CODING” screen. In the screen, select “2] WRITE VARIANT CODING” and press

![](images/e62596131b00e9051f28d88f8865b0ba87756b1bb9e737571211e2a9205ff1df.webp)

5. When the "VARIANT CODING" screen is displayed, change the item by using arrow keys.

![](images/e9e71e29a0bf6d9e98ba6c1697b6c73138bf61bae124d99e7d7bc5a86cfd1dad.webp)

6. If you press “Enter", the message as shown in figure appears. And, then "“VARIANT CODING” screen is displayed.

7. Select “READ VARIANT VALUE” to see the coding coded value.

![](images/495f68e82be8dd5f9cb7350447e477307e268e02b0d79c6569565a2ff3adfacb.webp)

![](images/b0ebee93db3be437a7855498badf793cb7ea0f435329a0272c1f41c927e5bbcd.webp)


### ECU Replace
© SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10048

Preceding Work: Perform the “Entering Diagnosis Procedures"

1. Select “9] ECU REPLACE" and press “FUNCTION SELECTION” screen.

SCAN - 100 ECU REPLACE (STEP 2)   
REXTON ECU DSL D27DT Turn "OFF" ignition key and then replace the ECU. Be careful not to turn "OFF" the SCAN-100.   
(If turned OFF, start from first)   
After replace, ignition key "ON"   
and then press "ENTER" button. Y220_10049

2. When the “ECU REPLACE (STEP 2)” screen is displayed followed by “ECU REPLACE (STEP 1) screen, turn the ignition “OFF” and remove the currently installed ECU.


### Notice
Do not turn off the Scan-100 at this time. Record the below data:

Vehicle identification number   
Variant coding value C2I coding value   
- Multi calibration

![](images/1bcf4ec258c6b97e4130ce1da7303d6805bd86cffeee3a41b3a1ea1ef8b4b1c7.webp)

3. Install the new ECU.

![](images/562636ddc6a97131ab47889b536f0a4c097f802e0b8232a2604508ea35121471.webp)

If you turn the ignition switch to "ON" position and press "En, the message as shown in figure 1 (system initialization) appears, and then “MULTI CALIBRATION SELECTION” screen (fig. 2) is displayed.

![](images/fdc8203d67bcec15f03d5b2fa24edabea5ef136e79d207dabda3f33a9045cfc5.webp)

5 In “MULTI CALIBRATION SELECTION” screen, select “2] DOM/GEN” for automatic transmission equipped vehicle and select "4] DOM/GEN” for manual transmission equipped vehicle.

![](images/9b6f82450c7110540a394e36df17bcb8e6fb31ee493b21728283101299335839.webp)

6When you press "EnteR", the processing message as shown in figure appears.

![](images/bb109f30678aebc08c2a514451ca137ee64a0ff2a41db17c321822036e71f9f9.webp)

![](images/b017a0f36efa33631f2dc4ec406b3c5ed8337ed5b93e1645a626e0474b2f4cb5.webp)

![](images/5884455518a428afa0bad10c50bb081df925f8c61ffc1942e087958623fee92b.webp)

7. If the multi calibration is completed successfuly, “ECU REPLACE (STEP 5) screen is displayed. Backup data:

-  Multi calibration value - VIN value -Variant code value - Injector (C2l) value

![](images/842de39d96fdca64da0b59932589caf97e2ef4bbb62979aa96135204ffd1a125.webp)

In immobilizer equipped vehicle, the immobilizer coding should be done after completed the multi calibration.

![](images/44d0f6d871573434a2625d3d4b0d393858be4083ff7375c7fbaa15ed1714987e.webp)

Press"EnmeR" and enter the user password.

![](images/3b752b27ffb72e0c56fc4b4100bba3b64aec964822f56487c2434395bb8081b2.webp)

10. If the password is invalid, the “access denied” screen as shown in figure is displayed.

![](images/88f892350411ce21044ce2b67e1aaa8a43f18bc712d4a74c331025fb3425b09f.webp)

11f the password is valid, an immobilizer coding is started.

![](images/0ceed95dc4ec50c156e6840e7b4a79826f25a8917491e5a0cca265378665ef97.webp)

12. If you want to code for additional keys, remove the first key from key switch and insert the second key. Turn it to “ON” position and press ENTER" to proceed.

![](images/58705018b44d3af9adabd01f0db3cda5f0e619cb95b46fd887d8746a5e0e9ce1.webp)

13. You can code up to five keys with same manner.

14. When the immobilizer coding is completed, press “esc „ The completion message as shown in figure appears.

![](images/3048202629943a6fedc28e23cc6d5e69bf62305c841143c8afad9cfe53f8b6d9.webp)

![](images/ea29f7d9c46a50c1e4c4469ad40c10bf5b83572b9b37fb723bc0155658f5b6f2.webp)

![](images/ca595d710cb5efda1ad299c0536850af74baf0a88330bd3f6106542a15e013ed.webp)

15. When you turn the ignition key to "OFF” position, the message screen as shown in figure is displayed. Wait for 15 seconds and turn the ignition key to “ON” position.

16. Press “EnTER" to retUrn to “MAIN MENU" screen.

O SCAN - 100 FUNCTION SELECTION   
REXTON ECU DSL D27DT   
1] TROUBLE CODE   
2] DATA LIST   
3] ACTUATOR   
4] TROUBLE CODE CLEAR   
5] ECU IDENTIFICATION   
6] INJECTOR(C2I) CORRECTIONS   
7] LEAK DETECTION   
8] VARIANT CODING   
9] ECU REPLACE Select one of the above items Y220_10061

![](images/048630e3c854a3ad44ea5e07125dfdd5e4f623d3217f49a953f96b1b615434d1.webp)


### TROUBLE DIAGNOSIS TABLE
INDEX OF DTC . .. 10D-24, 71   
Trouble diagnosis table .10D-27   
Trouble diagnosis procedures. .10D-75

![](images/9b188a1101f950cc464d185efd0133e3d6b1a06f0d9c3ddc90f1af94dbd61f65.webp)


### INDEX OF DTC
P0102  Low HFM Sensor Signal (Circult Open) .... DI10-27 P0704.  Clutch switch maltunction . . DI10-38 P0103  High HFM Sensor Sgnal (Circut Shor) ... DI10-27 P1115  Coolant Temperature Sensor Malfunction.... DI10-39 P0100  Mir Mas FJlow (HFM) Malfunco ... DI10-28 P0118 Coolant Temperature Sensor   
P0344  Cam Position Sensor Malfunction .. ... I028 Malfunction - Shor .. .. 1039 P0341 Cam Position Sensor Malfunction P0117 Coolant Temperature Sensor   
(Poor Synchronization) . ... DI10-228 Malfunction - Open ... ... I1040 P0219 Too Small Clearance of Crank Angle Sensor .. DI10-28 P0115 Supply Voltage Fault to Coolant   
P0336 Too Large Clearance of Crank Angle Sensor . DI10-29 Temperature Sensor... DI10-40 P0372 Crank Angle Sensor Malfunction ... ... DI10-29 P0685Main Relay Malfunction DI10-40 P1107 Barometric Sensor Circuit Short/GND Short... DI10-29 P1405 EGR Solenoid Valve Short Malfunction - Short .. DI10-40 P1108 Barometric Sensor Circuit Short .. ... DI10-29 P1406 EGR Solenoid Valve Malfunction - Shor .... DI10-40 P1105 Barometric Sensor Circuit Short…. .. 1029 P1480 Condenser Fan #1 Circuit Malfunction - Open . DI10-41 P0562 Low Battery oltag.e . -0 P1481 Condenser Fan #1 Circuit Malfunction - Short . DI10-41 P0563 High    .. .. 1030 P1482 Condenser Fan #1 Circuit Malfunction -   
P0560 Bat   . ... 0-– Short to Ground . ... DI10-41 P0109 Low Booster Presure Sensor Signal... DI10-31 P1526  Condenser Fan #2 Circuit Malfunction - Open . DI10-41 P0106  High Booster Pressure Sensor Sgnal ... DI110-31 P1527 Condenser Fan #2 Circuit Malfunction - Short . DI10-41 P0107 Booster Pressure Sensor Open/GND Short . DI10-32 P1528 Condenser Fan #2 Circuit Malfunction -   
P0108 Booster Pressure Sensor Shor.. .. I1032 Short to Ground ... ... I1041 P0105 Supply Voltage Fault to Booster P0325 Accelerometer #1 (Knock Sensor)   
Pressure Sensor... . DI10-33 Malfunction .. . DI10-42 P1106  Booster Pressure Sensor  Malfunction ... DI10-33 P0330 Accelerometer #2 (Knock Sensor)   
P1109 Booster Pressure Sensor Initial Check Fault . DI10-34 Malfunction ... ... I1042 P0571 Brake Pedal Switch Fault .. .... 1034 P1611Injector Bank #1 Malfunction - Low Voltage ... DI10-42 P1572 Brake Lamp Signal Faul . .. 1035 P1612 Injector Bank #1 Malfunction - High Voltage .. DI10-43 P1571 Brake Lamp Signal Faul .. 1035 P1618  Injector Bank #2 Malfunction - Low Voltage . DI10-43 P1286 Low Resistance for Injector #1 wiring harness . DI10-35 P1619 Injector Bank #2 Malfunction - High Voltage .. Dl10-43 P1287 High Resistance for Injector #1 wiring harness .. DI10-36 P0263Injector #1 Balancing Faul . .. DI10-44 P1288 Low Resistance for Injector #2 wiring harness . DI10-36 P0266Injector #2 Balancing Fault .. DI10-44 P1289 High Resistance for Injector #2 wiring harness .. DI10-36 P0272 Injector #4 Balancing Faul . . DI10-44 P1292Low Resistance for Injector #4 wiring harness . DI10-37 P0275  Injector #5 Balancing Faul . .  104 P1293 High Resistance for Injector #4 wiring harness .. DI10-37 P0269 Inj #   . 10-4 P1294Low Resistance for Injector #5 wiring harness . DI10-37 P0201 Inj #p .. - P1295 High Resistance for Injector #5 wiring harness .. DI10-38 P0202    #2p .. 10- P1290 Low Resistance for Injector #3 wiring harness . DI10-38 P0204 Injector #4 Circuit Open . 1045 P1291 High Resistance for Injector #3 wiring harness .. DI10-38 P0205Injector #5 Circuit Open. DI10-45

![](images/3061581539b2f2b125b3ed3ff58346c0e3b0afc782a72c55165de39336b71cdd.webp)

![](images/ca51ca02da269cf8d04850a434b0ec08b73af84384d5cb56b9e769c0071d299c.webp)

![](images/99b23c82cb6bd1408ac9340d879f1a22432ce308c7b9efb4caec6543964c30fa.webp)

![](images/0af7f6e57adfd357fca38c06fe61f8b79bd1aa8d4bac73a2acaf70ff33acaa6e.webp)

![](images/d717d16c767c0a89255883738b43eb0c400cc0fe74533f9df44ea4cb8960bd6a.webp)


### TROUBLE DIAGNOSIS TABLE
![](images/61e4dc6208005ab9b58e3aa8428e69fc4894ce1bbc48753d9e8a2196d072a18c.webp)

![](images/64df2008b8616365558a7548dfd924a90cbd00a697988b2b2abb0307fffcbce1.webp)

![](images/9824289df17b7d284dcd5bfe68b818e56e6ba94ce1da63586fceb0d6245836b5.webp)

![](images/757a0f80ec2eca2a055b8645724200f5a431dae22ffd6290047c45468c1815e9.webp)

![](images/a2c75f2ae005158ce963e6e87f38c45ea046acfcd47278de5d5692a2f19fd549.webp)

![](images/d094b8562c680a636b22aae8b71dc9d71802fb44e6c6d78bc6dca371aa7a61ab.webp)

![](images/dd5fddf7bed32ee48bb3c8c75c63565156e3dd5aaa298cea25bbb7db7ce25301.webp)

![](images/b67c19e758b6ef16a21f76207016f997a41739e044e5137ba14abefcc0cb8859.webp)

![](images/0a82ad07280cfdf6f376eb2ade3b40421d6347fb8992f19cd3dd7b429c82d004.webp)

![](images/3b8ed097e87301a98c92c0631becbc2548516e9239293cbd33ed2168c88c866a.webp)

![](images/767d42928254cbef0511a7212a20f6f1857ae4eef16c66fa1cdb67495ab47cb0.webp)

![](images/a8b0f9d25a83fbea3abafde7f63709360588ebd2ee40c5ddaa240bb36c39fe93.webp)

![](images/50aaa5b0a930c39b1a57d78c4e29e6d772d1ace7fa333c369562ddb629587232.webp)

![](images/8ebf2c8354c05b519080282b8a2d41bbfb301e8081197f96ab6db2c96f738ee0.webp)

![](images/bc215f351b2436d5987fc98e621574e82e555590e035e0620bd30899ee4ee56b.webp)

![](images/c6ba9508a0f6be0d54a937f04aeed7f7cf1c5d20a35ce74ad5d17ecf2f6cfff5.webp)

![](images/896f311ff127af3e816ad684b331d23aec27100a269ef05276338eb0ee1706f3.webp)

![](images/7bae30d8bbacbaa2ef59ec40aa4f9b8d80853e639a73136d4c3fcfa1f78d4363.webp)

![](images/50602c8d483f3dc3a07244fce971c4dd6981e069f309a4b17460ec10f0ac60dc.webp)

![](images/963b370c17e2e3cd199106896effa8a0de0a2508faf7fba2141611991a2c372f.webp)

![](images/db8ef0454a0a75320aa8b7af4ca457a7ed04917b5d7b059b881444ea38fbbe5c.webp)

![](images/e00d88abe0f5ac778df70d38a59e2dbb445de27039549cb8c2b7e8a709dfc12c.webp)

![](images/1027ee91b1b04fea8db433f90e9e87449b7d2fb55161168c10552d3639a8a45e.webp)

![](images/675262b7ca7dea6880bc9a386cbaf3a15319b50d5cf180d53a8155c4c5a4afba.webp)

![](images/96c5259b2cd6f02dc4cf86f4977190112d9818063df47def9186b159e8cf7ef4.webp)

![](images/15c83f9b2bc951e72b34ff55f98d3ccc6645dbc9828bcc5cc4b8d9860bb882e1.webp)

![](images/285c179a4fa09c479f1844981b1e006caad1184ed3cb8c873e881f8050c6e43f.webp)

![](images/0d26cd7405fd572d9dd0ecb663d994bee62dee14a6d6daffcb3028ea5c2f098f.webp)

![](images/65449b4d3399aab9350468a0fe89c57362de4d6b0e954eb6fec1874181d33606.webp)

![](images/9e1d321bb2b94e2afcfc5804d360f5bbe4d8161b76c942bae7397cda9279b06f.webp)

![](images/acca7a7c633c5d01d67aecad53b83898a6c46ac1908866fc420300e524c65312.webp)

![](images/48a3196d81a620a930675c51a5db9d7d70ce1da60e7d41a0bc329d42f0a38bff.webp)

![](images/cd14a9fab8019f6d0c8fdc6918acfcd60627d05dc982d0ccec7147d9c5a06387.webp)

![](images/2bf59344f267ca0c178da0162a7af3e70d1fae583cdb30ac73f6754431a3955b.webp)

![](images/3493416575dfae855a8900a66f6671fc29b13f6d479f97eafbca20c082dada73.webp)

![](images/83a400f9802fcc612b8d70aad9d20d6e3ed5cb90961348a0e365f9f9ff348b3a.webp)

![](images/d1f4b2d12724cbc8fe87bd93f31a8db867f6dde9386e9a7793e53eeff7515e66.webp)

![](images/f1bc0ac45edf7fcb5d8689108fd85837852d8978445a3a654a978e9d9ced57e1.webp)

![](images/3b8e71aaed1d6b8d042aac71d322f80625d354b695da907b2881900c268cc759.webp)

![](images/fd1e081d2e22d028b815e54ad375a1aaea97cb79357ed9cadea9e95b51c360b4.webp)

![](images/88fb2fa7cbcaf75314423928b3b23561305d17eb31b5ad471ff8289ed5df568d.webp)

![](images/40e71afd7de048b50ae9701541c3880ca7f7641cf7b1dbd448fd7dc4a1dadfdc.webp)

![](images/9b4c156c3db57f3ff15a2ee8cc7c0a77dfc0eab259b6bc02b90fe4a37aab0604.webp)

![](images/2408c45dfe009bcc1320e874d7f8f6da3ef592577c7a2d5c5c0660d9e2249b59.webp)

![](images/6a74737608506e3306bc2cd4c38a98bdfd861fb18650e91f523d73300df960b0.webp)

![](images/03613e52861a92a80e0c08899b85a9e7579dd8f1e7bf9b66c33f8661cc73715f.webp)

![](images/9065dffe12fa33f81ddc5b12d96719df249e4084d3a148bf349380a8b80ac8ce.webp)

![](images/7e14f6444062f54429ec71f7cfcf1f3f6967c13734498d0a8506d2535b1f4366.webp)

![](images/88f222434820493ee7d84ae9d45d13d9a9ffe375078736dadac5e1cb78e11db3.webp)

![](images/87d63c9c0273f2acb61cfa9dbd5fcb66677ebab7054c025ddc147c1422a920c0.webp)

![](images/e1290c17532aea80e9dbee40574022164f85cb911537bea915049f26404c4765.webp)

![](images/8684aaeaff4bbc0ad37f37f81d55743a94bf1e5880b86c5e0e03eea2d77240c8.webp)

![](images/d0dba42bc4319ad0f0a65acfa2feae8faffb93bddaea5471ecd3842b327a8441.webp)

![](images/5f88f7ee5521483d8b78e6b46d5a422c5b87b974ffca9f2843bf86653a92c11f.webp)

![](images/6fb9c4cc99d481f15e4179138450b2ddeddfdf4c0d322e1057f315b4b664d1e8.webp)

![](images/1236414609855cec2823593795524b76dba83407ba4a9f8177697a99df3a3e28.webp)

![](images/a3ecabeeb754b05842653a0ba96bca8a8f854520e8e3214dd29305d93f96532e.webp)

![](images/3b9b0e1ed380e786871f718e4047e24408412ddd9ab1500d02bb98747f534e12.webp)

![](images/bd9d6af364fe72cb4f2761e00950930215a7d72b34060286a22120021ecc5963.webp)

![](images/9c0e3c073c4ca5fe88d4f35d83f89c5aad8197d3e5cc31cdc5b5f09627a2874c.webp)

![](images/350362038ee88cc9823b7fc5ca7b4c6bc7786ff2fa256fd817532417944e1928.webp)

![](images/237ec579d4bdcdfd7c8f47b9570f7e4e16b81a0ff4586cd01d9ab1e01bda2324.webp)

![](images/ca5452d078706bd21d2244dc78ba3bc86e88bff3528eaf256c6cc85aa329f817.webp)

![](images/0bedd977a06afff4030d259c82bf87ae29df7774f9879dbb2b785c87fde07b7f.webp)

![](images/7c51f4c99e23fffe4be118d507f17f6f265f13bfb7b1c5f056108e7de3104b27.webp)

![](images/b374ed1de28bbc72671984ed87879ce83b5a08f77645b9113304919245e783f5.webp)

![](images/38c4ae30aa78a110cf16ee8f9519929cfc68e8985ce9acba4fe1992e5dbb8e02.webp)

![](images/286ea8a659d8d631d110d5f9d4d8880196d18b950247738c8accec95279a5885.webp)

![](images/70a0fce854f6900db9a00cba43bc98f129ff7652c1a99d0138e12b60716d6d29.webp)

![](images/cb5306b500692b5329a98dab05f0da6bbb605de1d26d85ca263bb465913396d6.webp)

![](images/774eb48b012675f23de7e59f77afc2b470b28f38244f978c1b6cb7b2a4b8fc47.webp)

![](images/a4e18e6e73866d7704b900ee0d28012a7aae8aac980c31d486be5fb9a18fc87f.webp)

![](images/edc6e50c9399739041267ff880eec804a5b77d7cb21ea3bf837c79e6350e6b93.webp)

![](images/5d5a99b1961d2ba2ac8a5dce30770e48dcc1cf6bc7ef0e143f92d008ca0f79e5.webp)

![](images/62cd6badc14eb115a5ba9c886804df10a843265a5780576ea4b2d2c62d6ae8e7.webp)

![](images/aec449b815e4575f7aa00660cd6e39ee1e81fc53bc6ea573a1289d1d24aba947.webp)

![](images/feb6370fa62ebde12986fceae1d002351fd108d4c31941e7605aa52375c88a49.webp)

![](images/b4fab38c0293ecaeb9de3ea0d06b331b5f9dc92f1542bef9f36d2f09fbe2b7b0.webp)

![](images/45c6cbd514cb8f24f5b3db3a1f1e820b0e61898f0718b5e92dab40ec71b3932e.webp)

![](images/62366b707826ca89365e345025daa8971b54cceb6b1bad9f24a69a547ca46aa6.webp)

![](images/ba86aa66e128968fb3b1892d2bbd43b09829ad12a34ed12e016b3f049d6d95c3.webp)

![](images/216796f2be001deefa0626251220b97faa49ca4a240b7ef8f69656f667ea7376.webp)

![](images/544bdf4640b0e4da092d75d70fa923f803340778c3d081c4cbc5762606a63ae5.webp)

![](images/dad8890892c53f01bcf905b5cb44e8620f3598e8d4b964fa80e383d8f3e4eff7.webp)

![](images/ec92344215276269b150467bc9283fc40d69362489a8de873b905626787918a5.webp)

![](images/118e6e0b41ae1504584186a1aaa9d61a6db9aee8879702bc2dbb2ca2d4f74fde.webp)

![](images/e0bf284b146a98ad8851fff44f62e95118bac43c3d25cafd992d5dc2dc9ac561.webp)


### INDEX OF DTC
HMF sensor Signal Fault (Electric Failure) .. DI10-75 Brake Lamp Signal Fault. . DI10-91   
P0102. . DI10-75 P1572. ... DI10-91   
P0103. . DI10-75 P1571. . DI10-91   
P0100. . DI10-75 High Wiring Resistance (Injector #1) . DI10-92   
Cam Position Sensor (missing event) . . DI10-76 P1286. . DI10-92   
P0344 .. . DI10-76 P1287 .. I1092   
Cam Position Sensor Malfunction High Wiring Resistance (Injector #2) . DI10-93   
(Poor Synchronization of Crank and Cam) . DI10-77 P1288 . DI10-93   
P0341. . DI10-77 P1289 . DI10-93   
Too Small Clearance of Crank Angle Sensor. . DI10-78 High Wiring Resistance (Injector #3) . DI10-94   
P0219.. . DI10-78 P1292.... . DI10-94   
Too Large Clearance of Crank Angle Senso.... DI10-79 P1293.. . 1094   
P0336 . . DI10-79 High Wiring Resistance (Injector #4) .… . DI10-95   
Crank Angle Sensor Malfunction. . DI10-80 P1294... .. 1095   
P0372. . DI10-80 P1295. . DI10-95   
Barometric Sensor Malfunction (Out of range, using High Wiring Resistance (Injector #5) . DI10-96   
stra n y AP r.. D1001 P129. … . 10.6   
P1108 .. . DI10-81 Clutch Switch Malfunction . . DI10-97   
P1105 .. . DI10-81 P0704... .. I1097   
Battery Voltage Monitoring Signal Malfunction .. DI10-82 Coolant Temperature Sensor Malfunction   
P0562. . DI10-82 (Implausible Signal) . . DI10-98   
P0563. . DI10-82 P1115. .DI10-98   
P0560 ... . DI10-82 Coolant Temperature Sensor Malfunction   
Booster Pressure Sensor Malfunction (Electric Fault) DI10-99   
(Out of range with Key ON) ... . DI10-84 P0117. …… ... DI10-9   
P0109. . DI10-84 P0118 . DI10-99   
P0106. . DI10-84 P0115 . DI10-99   
Booster Pressure Sensor Malfunction Too Fast or Low Main Relay Operation . DI10-100   
(Out of range with Key ON) . . DI10-86 P0685 . DI10-100   
P0107... .. DI10-86 EGR Actuator Malfunction . DI10-101   
P0108 ... . DI10-86 P1405. . DI10-101   
P0105... . DI10-86 P1406.. . DI10-101   
P1106 .. . DI10-86   
Condenser Fan Driving Signal Fault (Type 1 . DI10-102   
Empar lvw Aauaction .. 100.-8 P14 10   
Brake Pedal Switch Malfunction . . DI10-90   
P0571 . DI10-90

![](images/9bb659232ea392248338e140b8fa896b6b2b0c49d094fdf554059a6aa2690a11.webp)

Condenser Fan Driving Signal Fault (Type 2 ... DI10-103 Open Circui (Injector #3) . … ... DI10-119 P1526 .. ... DI10-1103 P0203.. . 0-19 P1527. . DI10-103 HSD Circuit Short to LSE (Injector #1) . DI10-120 P1528 .. . DI10-103 P1201 . DI10-120   
#1 Accelerometer Malfunction HSD Circuit Short to LSE (Injector #2) . DI10-121   
(Idling Signal/Too Small Noise Ratio). . DI10-104 P1202. . DI10-121 P0325. . DI10-104 HSD Circuit Short to LSE (Injector #4) . DI10-122   
#2 Accelerometer Malfunction P1204.. ... DI10-122   
(Idling Signal/Too Small Noise Ratio) . . DI10-105 P0330.. .DI10-105 HSD Circuit Short to LSE (Injector #5) . DI10-123 P1205... . DI10-123   
Injector Bank 1 Malfunction   
(Short to Ground or B+). . DI10-106 HSD Circuit Short to LSE (Injector #3) .… . DI10-124 P1611 . DI10-106 P1203. . DI10-124 P1612... … . DI10-106 Fuel Temperature Sensor Malfunction.… . DI10-125   
Injector Bank 2 Malfunction P0182.. … ... I0125   
(Short to Ground or B+).. . DI10-108 P0183.. . DI10-125 P1618. . DI10-108 P0180.. . DI10-125 P1619. . DI10-108 Glow Plug Malfunction (Driving Signal) .. DI10-126   
Cylinder Balancing Fault (Injector #1) = P1678. . DI10-126   
Clogged Air Intake System. DI10-110 P1679 . . DI10-126 P0263 ... DI10-110 Heater 1 Malfunction (Driving Signal) .. . DI10-127   
Cylinder Balancing Fault (Injector #2) = P1530... .. DI10-127   
Clogged Air Intake System. .DI10-111 P1531... . DI10-127 P0266. .DI10-111 P1532. . DI10-127   
Cylinder Balancing Fault (Injector #4) = Heater 2 Malfunction (Driving Signal) . DI10-128   
Cloged Air Intake System ... DI10-112 P1534... . DI10-128 P0272 .. DI10-112 P1535.. . DI10-128 P1536 .. . DI10-128   
Cylinder Balancing Fault (Injector #5) =   
Clogged Air Intake System . DI10-113 Rail Pressure Control Fault P0275 . DI10-113 (Too High Pressure) . . DI10-129 P1254... . DI10-129   
Cylinder Balancing Fault (Injector #3) = P1253 ... . DI10-129   
Clogged Air Intake System …. , DI10-114 P0269 ... . DI10-114 Rail Pressure Control Fault (Too High IMV Current Trim, drift). . DI10-131   
OpenCirui inpeco 1). DI101 15 P125 . 10131   
Open Circuit (Injector #2). DI10-116 P1258... . DI10-131 P0202 DI10-116 P1259 .. . DI10-131   
Open Circuit (Injector #4). DI10-117 Rail Pressure Control Fault P0204.. DI10-117 (Too Slow Pressure Build Up while Cranking) ... DI10-133   
Open Circuit (Injector #5). DI10-118 P1191. . DI10-133 P0205. DI10-118

![](images/43cc21b2b167bbe9a0af29bce435bdbaada90f8356907369dea6190f2bfb7c92.webp)

IMV Operation Fault (Electrical Fault) . . DI10-135 Accelerator Pedal Sensor Malfunction   
P0255. DI10-135 (Electrical Fault, Track 2) . DI10-147   
P0251. DI10-135 P0222 . DI10-147   
P0253. DI10-135 P0223 . DI10-147   
Intake Air Temperature Sensor Fault P0220 .. . DI10-147   
(Electri ... I00136 Fuel Rail Pressure Sensor Malfunction   
0112 . DI10-136 (Out of Range, ADC or Vref . DI10-148   
P0113. . DI10-136 P0192. . DI10-148   
P0110... . DI10-136 P0193. . DI10-148   
MDP Faut ilecr 1). .. I11017 P019 .. 10145   
MDP   # . . DI10-137 Fuel Rail Pressure Sensor Malfunction   
P1172. . . DI10-137 (Out of Range when Key ON) .. P1192. . DI10-150 . DI10-150   
MDP   #4 ... I10-138 1193 . DI10-150   
P1174 . P1190 ... . DI10-150   
MDP Fault (Injector #5) . . DI10-138 Main Relay Malfunction - Stuck .. . DI10-152   
P1175 . 021-   
MDP Fault (Injector #3 .. .. DI10-139 Vehcp. . DI10-153   
P1173 . . DI10-139 P1500. … . DI10-153   
Rail Pressure Fault (Too High) . . DI10-140 5V Supply Voltage 1 Fal…. … . DI10-154   
P1252 .. ... 10140 P0642.... .. DI10-154   
Accelerator Pedal Sensor Malfunction P0643. . DI10-154   
(Relationship between Track 1 and Track 2 ... DI10-142 P0641..   
P1120.. ... DI10-142 5    .. -   
P1121. . DI10-142 P0652...   
Accelerator Pedal Sensor Malfunction P0653. . DI10-155   
(Limp Home Mode Operation) . DI10-143 P0651. . DI10-155   
P1122 ... DI10-143 2.5 p . ... 0156   
Accelerator Pedal Sensor Malfunction P0698... .. DI10-156   
(Torque Reduction Mode Operation) ... . DI10-144 P0699. . DI10-156   
P1123 . .. 1014 P0697 . … .. 10156   
Accelerator Pedal Sensor Malfunction Turbo Charger Actuator Operation Fault (signalDI10-157   
(Electrical Fault, Pedal Stuck) DI10-145 P0245... . DI10-157   
P1124.. ... 0145 P0246. .. .10157   
Accelerator Pedal Sensor Malfunction ECU Watchdog Fault . . DI10-158   
(Electrical Fault, Track1) . DI10-146 P0606 . . DI10-158   
P0122. .D110-146 ECU Watchdog Fault (Injector Cut-of ... 10159   
P0123 DI10-146 P1607. . DI10-159   
P0120. . DI10-146   
ECU Watchdog Fault (Watchdog Trip) . DI10-160   
P1600. . DI10-160   
P1601. . DI10-160   
P1602. . DI10-160   
ECU Non-Volatile Memory Fault . DI10-161 Glow Plug Module Circuit Malfunction - Open ... DI10-171   
P1614. .DI10-161 P0674. . DI10-171   
P1615 . DI10-161 P0675 . DI10-171   
P1616. .DI10-161 P0671 . DI10-171   
P1606 .DI10-161 P0672 . DI10-171   
P1620 .DI10-161 P0673. . DI10-171   
P1621 .DI10-161   
Glow Plug Module Circuit Malfunction - Short ... DI10-172   
P1622. . DI10-161 P1674.. . DI10-172   
ECU Memory Integration Fault DI10-162 P1675 . . DI10-172   
P1603 .DI10-162 . DI10-172   
P1604 .DI10-162 P1672. . DI10-172   
P1605. . DI10-162 P1673. . DI10-172   
Accelerometer Learning Fault . DI10-163 TCU Signal Fault . . DI10-173   
P1148 . DI10-163 P0700 . DI10-173   
EGR Valve Control Fault . . DI10-164 Air Conditioner Operating Circuit Fault . . DI10-174   
P0400 . DI10-164 P1540 . DI10-174   
VGT Operation Fault . .DI10-165 P1541. DI10-174   
P1235. .DI10-165 P1542 .... DI10-174   
TBD . .DI10-167 Excessive Water in Fuel Filter. .DI10-175   
P1608 ... . DI10-167 P1149 . DI10-175   
No Crank Signal . DI10-168 Immobilizer Malfunction . DI10-176   
P0335. . DI10-168 P1634 ... . DI10-176   
P4335 .. . DI10-176   
High Torque Trim. .DI10-169 P1630 DI10-176   
P1170. .DI10-169 P1631. . DI10-176   
Glow Plug Module Communication Fault . . DI10-170 P1632 ... . DI10-176   
P1676. . DI10-170 P1633 . . DI10-176   
P1677. . DI10-170 P0633. . DI10-176   
P1636 . DI10-176

![](images/179f79fdfea0a6be1cf6340f9a73d983c9cfbeb0a41c18186a60bc773296d1ca.webp)

![](images/3122c1f8dd017d4e98fe5f45aab5bc09b9c3ff95e253770be713fbd8b1cd7121.webp)


### Trouble Code and Symptom
![](images/1eb48ccb21530ad63f20dc53dc78ddf5b951ca92f9b7c82cff1cc55f76941f4a.webp)


### Diagnosis Procedures
![](images/2ba7816a4d6863cf5d1e8dc09435067c090590a1fe31707cd0c976448878bae9.webp)

![](images/1f2b2a10a86074da2eb8491fd1f50f9caedef0aa37f5a4ff6a8bc5e7c9e4408f.webp)


### Trouble Code and Symptom
![](images/cd957520efc6cfb182c27ac52ac7e0ceaa0bf87707c58126f54a1e099e83b651.webp)


### Diagnosis Procedures
![](images/bc8b3f640a54833bb05fb1306b85bc4d8b658808b958a0f8f7fd441fbb4a0cf9.webp)

![](images/e039c5cf27d89ced7046cd9580cfafaa2df876658c5d842571e36f5f523f681e.webp)


### Trouble Code and Symptom
![](images/4bbbb5b76d5afbb12210f62ca1667272c39e809d2ce5cbad178ed2b6d9cd9990.webp)


### Diagnosis Procedures
![](images/8a0074a4fd8034f6eb45cc4ee71c2f0b6f5749be7bbb0eaa39848d608099423f.webp)

![](images/624de970b2fe57c14a50d391697332e6920ed7ffd553f2f39ac633675a5879fc.webp)

Too Small Clearance of Crank Angle Sensor


### Trouble Code and Symptom
![](images/511e89c2b563c7e608b5dffc4de728e88b896350a9f719571b6ca944292fb576.webp)


### Diagnosis Procedures
![](images/10ede84486dd54b1b2309dd3cee7d576a208645c37c32d03fd527226d9694d7d.webp)

![](images/2417ea1da7b90a26e4b678b35658349c40fc5e50d6566c5a6850ae06957e4874.webp)


### Trouble Code and Symptom
![](images/0b44c55ee5c9438588255401912d7d9d63105da662edfad6627e3cb81bb7942a.webp)


### Diagnosis Procedures
![](images/e5328018154400cb445587e57971e34f3cbf0bf07ea4de52d538aad6c3669413.webp)

![](images/4c8265cfc940f6b3136229c614e98365a0942376dced578e0bf9fe1adff63811.webp)


### Trouble Code and Symptom
![](images/23fc7b329cf2ec791b980d9072dae4f0b37cfb2849434e328b10ed58a4999156.webp)


### Diagnosis Procedures
![](images/7a96128caaea6ae4ab2b7363ac4ababf2eb140b48b266490b0f83917dcaaa0b5.webp)

![](images/f33323ec079ae0ae3534f651781f8738c84a79318342872c6180f537a9ad15cc.webp)

Barometric Sensor Malfunction (Out of range, using strategy of restoring by MAP sensor)


### Trouble Code and Symptom
![](images/2dd1730ae5bec014713cad7844a2c25b7923f6a1dae81d0671d04ce9a54b4d25.webp)


### Diagnosis Procedures
![](images/edf1905f803d0af66e77d118f8172b6d5582bd5727dd9b2062557bc30015bd6f.webp)

Battery Voltage Monitoring Signal Malfunction


### Trouble Code and Symptom
![](images/2110eaeef3c07b86c0790b8c0fcb9404842f24d60ece0701117c056955d0a758.webp)

![](images/b587879e2c0169efc43778ecc32fa2aeab2c6f3d1e7112dcb7c7fb17a2faab5b.webp)


### Diagnosis Procedures
![](images/559368d2dca80dddd6e7e778c749f652b8f97a0f1b59f70742d8e37061bc310f.webp)

![](images/8ee2917604affb232f88d34863d5c89dc092339083b90b0e532281244864b01c.webp)


### Trouble Code and Symptom
![](images/18e7a092731cff37762a79574357e3af664f35e4ce62e6dda6dfbcc10edaf67b.webp)


### Diagnosis Procedures
. Diagnosis Procedures (Boost Pressure)

![](images/8763cf9157318a9ed8123ae39a4ab68c7c2760b2a2272200a6f6170088184d36.webp)

![](images/80900c7245f892bd42b11a6bab6135f93f71e2bbeb57e9e88964edca119bbe8a.webp)

Diagnosis Procedure (Check sensor (1))

![](images/e24cc292dbf689b41937294adbc66f0d9f2ff2ea0cac54aca04022e75fa825f6.webp)

![](images/cd7ae713d7bb9fb9ed6085df834770352674304e753ccc53de3d09233ce2a6cf.webp)


### Trouble Code and Symptom
![](images/8a4e43275026eaadc1e21eca4aa237c0befaabbe01b6a582e1c6c9e04f99bab5.webp)


### Diagnosis Procedures
Diagnosis Procedures (Boost Pressure)

![](images/dbfdafc8be9ae912d35699dee42ecbd3c6e98397278a232121899354d56abd3d.webp)

![](images/8644ceacbcc212df5702b70c570a655ffe3ed9d4b5dffb2729fa71f6b9cfaa8c.webp)

Diagnosis Procedures (check sensor (1))

![](images/708cf3edce9d16d9c917e735791dcb7716a753a0bc2fb32a5b2bcf27715dc563.webp)

![](images/575a9ab4e81b4f08a9529e4a01f2768387c0ea7d99b8463d47b523171c250f5f.webp)

![](images/7e80c208c34f986ac3717b5f1cb4732c9826762cd64705828a3ce624846ee41c.webp)


### Trouble Code and Symptom
![](images/b36c030a5ddb2bc7edf011099ddeaa1373f9a3ece3c564abc460727071cae3c2.webp)


### Diagnosis Procedures
. Diagnosis Procedures (Boost Pressure)

![](images/40537c3307251aa3c3089b372884adec66862ba537ec720a56f85382f3579a70.webp)

![](images/9bcb61b5b8f2b3566f84fbf78d5e0d44fc711ac770aed0563b84b96e3bc361d3.webp)

Diagnosis Procedures (check sensor (1))

![](images/b9081f26cd4ef35e64d8942acd68c0ba04f373ef5e47a1d69cd966447c0a6a62.webp)

![](images/4b8653ea4d4cd23db6dfd58dc0624eab7b979a69a8006f4b40cf2b13ea9f58be.webp)


### Trouble Code and Symptom
![](images/9f184e7ea1da0f29757cb71794efc72b1dc79f78c996bbaf08477f9e3c569fc1.webp)


### • Diagnosis Procedures
![](images/6d30f4cb0da72d40665968b8e228d7fdce45686d4b25a9a9c5cd1100ca2e94de.webp)

![](images/07438990a8490541e1e673df6ad7d0be718d8468e1339559f3af3982a0977cd8.webp)


### Trouble Code and Symptom
![](images/b06bfd63280e50224860d7b93bc54451135b25d3459d0912f97352eecaaa368f.webp)


### Diagnosis Procedures
![](images/2e1311d4c2f06a050eeb47dada56cf0642d3c5e1e3473978859a17427e5bae2b.webp)

![](images/0baafb451621be005fd4b4fd2f92601828f3cb54f490514cd2c5ecad85fb6b8c.webp)


### Trouble Code and Symptom
![](images/01a3b6a6303b98a834f011fa68da2f8147883a2cd43a3b6b2ebe7eb235224426.webp)


### Diagnosis Procedures
![](images/48a75a5b3b2c72c6e12ffba6ffea58095ead86838244a28da4090f14de5a8b8d.webp)

![](images/43e0e9b664b0a9be46a531ee7c26af3f0960b46990dc4a001291f4bed225647b.webp)


### Trouble Code and Symptom
![](images/f33b1be03f55344ee11d6099f72f58603b8b7dffdd93d2ac411017ae558bb7bc.webp)


### Diagnosis Procedures
![](images/afd65246aa93a999f035de047f184ec5706795dea80160e3f0161455b316bc6f.webp)

![](images/65f252e70cab9f0ab440a6acc3e571163588eada33db20f3ed7c11fc2f6c5236.webp)


### Trouble Code and Symptom
![](images/9a8036343f2674c8c7ecfaa5290ad0fb477addd6287a06c41c8d34f23f66c22b.webp)


### Diagnosis Procedures
![](images/7f48d28e551ee1eea5325fc233ed24f3a79389cfe642ed04e492c6cfb5711095.webp)

![](images/9e6b48f02ddbd1c610bbfd82794790b62ea0e5e07bd003a76c6820ef61fba6b7.webp)


### Trouble Code and Symptom
![](images/7d2e839538d2513a0a29e5045396b27a87a7d9a52afd04cf3141ff82d436bd4f.webp)


### Diagnosis Procedures
![](images/d1390e85acf4fc6e7c9197409e2d4b11d28c6c289c3dbefde5ce39c4fa4dfac9.webp)

![](images/d859ececc9ff057d4234a4fc3d79891db6630124a54102a1ef4cacfcb6b5b321.webp)


### Trouble Code and Symptom
![](images/5075a445dba7a01024993989ce1628c077fea2a3217036cbc6ed0aa1d7c54536.webp)


### Diagnosis Procedures
![](images/dba31bab4692e108547b1ee98df31c86e5482f27f62762611e04ac7a3844e835.webp)

![](images/ef89ab9fa2c0ae9b3fc1deba5ca2abd9963ddf81972ff86845e2cd973f0cbd48.webp)


### Trouble Code and Symptom
![](images/41e56068d0f3cbcf10e6180abb2529f33555a937e21ec8db91648e5e77046bec.webp)


### Diagnosis Procedures
![](images/c02276802b46e025569b35143d3deabc7cb74a3f82b869e167a1330982294c20.webp)

![](images/232a1af721093a74d3ad7704ca7daa983649dfd4d082c2fd0a28fd0edc7acf3a.webp)

Coolant Temperature Sensor Malfunction (Implausible Signal)


### Trouble Code and Symptom
![](images/7654a80dd93d59fec91b979c1c427332d1e5c5322d22a4929e0f3d98d3873038.webp)


### Diagnosis Procedures
![](images/8f126690e623fca5dcf269a010ae66a8e3201c572fe8cf70e86074bfc6c92104.webp)

![](images/d1f7fcb823a1c5895915b54c26e1510d147f2d7c35ec1f5792df2f35acfc3f2a.webp)


### Trouble Code and Symptom
![](images/0443d5c7e6dc85b4218e4cdbe301f03841b47a19924024acc20f7f195859026a.webp)


### Diagnosis Procedures
![](images/0b641d57ff9abe0bee56633cdf174ac40c7738aa72181c08fba8bf6b4d01d5ee.webp)

![](images/dbdbd620b87c1dc7744722af9a548e519237d38ab4c70d4fd581de4c52a7696b.webp)


### Trouble Code and Symptom
![](images/9ed168729c357c00b7ea342e730e5088c16fc8dd95a4d19c27fdb3efa158433e.webp)


### Diagnosis Procedures
![](images/c0e0e0c9f1d48d0132e015065d8ea90f6c6410c431d475a4afa50589f9a57da6.webp)

![](images/908e6175f61b160db6f5f3ecad99a8b0015455ac1e53c1c8845fe83f486c4bcd.webp)


### Trouble Code and Symptom
![](images/831eb676e1a9e5157231dfc0c0a5c2c720f03517d52b2022d75967af2ac46fce.webp)


### Diagnosis Procedures
![](images/699ef4b08716d581c45a555f898fb6ddec284e4678e2bb2c9a3448b136787757.webp)

![](images/75fb7fa34d4af45f490cbed5efb352e9e262e1d5bc92e7cec4322c1b5f5a3a90.webp)


### Trouble Code and Symptom
![](images/36782b6606b8b8a43c8aed31292a49146fc622d9b3f20e8f12013123e571033b.webp)


### Diagnosis Procedures
![](images/89731f550464616e1f54f21140e68d5a9b03b79dc42d799411ca0cb9148ba121.webp)

![](images/a5e7a060b6e1966324671c86258ab7855f3d163926012a7f9e3fa9eb7e4c1225.webp)


### Trouble Code and Symptom
![](images/28125cc2f0f22ff1d54b136425ccbb9e1758dbc36459cffde834fa4e88b3a3b6.webp)


### Diagnosis Procedures
![](images/9084a07a57c245d9b328509c5620e64547fa76b3419087fee4fc6f0ac28299b9.webp)

![](images/d199575c46307d1d9f3181b10bae1efecb8d9ca3a241bb7137ddee2b4767cf69.webp)

![](images/86a2d65ab0730cb210a5abe5ce85f663e785f657e813afdb200f7ab45f925937.webp)


### Trouble Code and Symptom
![](images/818abb8c2aa25fdc76c63f65d9795e4b9c8974574b8ae8899a077ce9f11782a1.webp)


### Diagnosis Procedures
![](images/1dd74d5cb86e6eeaa5ef8732e0f66c6341c374a906095781493664a8f25b0b47.webp)

![](images/52e18845f846e1d2e566a982d028dbed572302deeab9d9a932b8267e0f20d2cf.webp)

![](images/177675c33002d68f647415e9f8d1ff5fd300968519cb05088cf741fb735c4a3c.webp)


### Trouble Code and Symptom
![](images/d3cb229110a074bd2979cc4404f264419add6146aafbe84e133096d95ef48763.webp)


### Diagnosis Procedures
![](images/fa46002ed95ef1927a91d38260d30416fa9c3c9203997d29e39d73535ca3d378.webp)

![](images/15748281d5c7a0f021f2d0a921ae47b16ae3f0313e9155c3c3492285ea22b627.webp)

![](images/19bb560a0e06704f9f43c1f1017ddf6a35778c90e33f857e58a7e0f0458d26c9.webp)


### Trouble Code and Symptom
![](images/4348d5a4696b4795e92435bed6562827f403dea3d25b37b929fe454b6fe0eeea.webp)

![](images/77eaf5cfec7c02d6dd5dc46299d9220a081833739290cbdeb3a4a14488a76ecb.webp)


### Diagnosis Procedures
Fuel Injection Bank 1/2

Check Injector Wiring

![](images/f860410a7f372a41bdd71a7ee720c8b5c8b81cc31becebf27b3e24abf8a48239.webp)

![](images/17437df66963fef115ddbf320321f0f1e7457faeb356a66750390806a114bd8e.webp)

![](images/f8b567c2303d4a4406063464c49eed4bc7bd8391f0de3e4af8bc3260ec9c1ae0.webp)


### Trouble Code and Symptom
![](images/32017af513f3b535f3ff5f8efc30ba980b03c5efe672413b981b4aa9a28f4810.webp)

![](images/8fd364c2ddbca851f293eab6af11c9a7b7904696686a06c9424e18ec4db819a6.webp)


### Diagnosis Procedures
Fuel Injection Bank 1/2

Check Injector Wiring

![](images/216a992c7343e3c679b71a9bc5bf80a6916cedcfd53fd1ca88202222b5acd349.webp)

![](images/adc7440a6091725991d747f5a92ddb7be8f83a9c297db2d0ce9c0be2edeb5451.webp)

Cylinder Balancing Fault (Injector #1) = Clogged Air Intake System


### Trouble Code and Symptom
![](images/1e93276bd35b89ba32843d8fa081fda0d6956b957d9fb2359578fd1cb6be7d81.webp)


### Diagnosis Procedures
![](images/9cef326a45950dc81a571a1cd908d1c475ced320d7b2b61b3b3157fa29dd2513.webp)

![](images/8a70c3f739920aa19d20e0d385109ef394c35c39f3cfe0d375e3a48c6237804f.webp)

Cylinder Balancing Fault (Injector #2) = Clogged Air Intake System


### Trouble Code and Symptom
![](images/9d32b0b05440e0871b0970d8072fe0cf1fc51f40733951add3dd5808a852c325.webp)


### Diagnosis Procedures
![](images/7c783e850a115e0fdcfbcfb2b0f439dd7a6d2c61e419f968328dc52005df25a7.webp)

![](images/77896c47f2e3d8cf5f1278ba3d0ae38482eae2dda1585d6ffa2919afcd4cd310.webp)

Cylinder Balancing Fault (Injector #4): Clogged Air Intake System


### Trouble Code and Symptom
![](images/d0fabf8f2daabaa28f32017e3a535bedd820b70ec256acc35671162bdd3c3830.webp)


### Diagnosis Procedures
![](images/7d7fcd4980f1a98724b463f5ab620dcebb16bbf88e82ce929f87a9169761da1b.webp)

![](images/9d85ad2912490456d11d55e92c95f508acf6776de6c3a84bbe2f4800057275d3.webp)

Cylinder Balancing Fault (Injector #5) = Clogged Air Intake System


### Trouble Code and Symptom
![](images/dec70f5c0e804c75ed0af2d1170b4894e840c07e0d3b0e22705083f46a68a8d4.webp)


### Diagnosis Procedures
![](images/9de1f0b5adf2f722b4dd86728b59ffc277c9f377679d46e34c5e24e8f53e2d19.webp)

![](images/b475755b7de4a617b5d27a64eda563b38fce1db580004a7e81e450ed93a8a5bd.webp)

Cylinder Balancing Fault (Injector #3) = Clogged Air Intake System


### Trouble Code and Symptom
![](images/b93fa168d79d0e263c9aa517e203ccc765e8c14784a479b0bcbe4436583adb69.webp)


### Diagnosis Procedures
![](images/ace9514811fb500cb14f968158d46acb61c8e4c17242857c718cede2144f8e09.webp)

![](images/a20306841dd5a18d4931a86d336f7d63e3453321aebd221255a66066351a55a3.webp)


### Trouble Code and Symptom
![](images/7270bf51a87ba782dd86d1c951f8e12aaadad8c71092f09c099beba67f0e50cb.webp)


### Diagnosis Procedures
![](images/ff3bb2e61a463f86708c0410168963a497bb26c94cd8f416f97424fa63284859.webp)

![](images/fa6629e2addb7efb6f6413c01222627ca64a2a74966a07677b22e5a9debbeb63.webp)

![](images/6731d01cb94bd8a4a44cafee3e948ac19bdb4b532f66d4499b440b18b35c1858.webp)


### Trouble Code and Symptom
![](images/4434c95eae8239a63f310c94607042e1a181c58c95250f72bdfc37b9123e1b03.webp)


### Diagnosis Procedures
![](images/8c0679e8406a34e249b1ee7ed31246da676e10a6effacaae68154bccbc43f65a.webp)

![](images/ac6034d253a59cd9e470253010539ea1d6702f94fbbb587f761b949b635a66d4.webp)


### Trouble Code and Symptom
![](images/42820b6626a9099e661663d16d1d12add726ab7db1d0244f4ffa8689d2fbee15.webp)


### Diagnosis Procedures
![](images/fc75006a8f12f413af7669ceabc89cb70eb98d90e6b3068eeaa911801c6feaac.webp)

![](images/63e685edb554b573407e1d28e9e923f7cf6be38ff5e70df547dd6f716a7085a9.webp)

![](images/e9b5bc603338b71b417bc50f63a3a354ee0a04a00d4deb6d6dad2740c390a054.webp)


### Trouble Code and Symptom
![](images/ec1a823b71ef586f591f0664ccc4d20bd7d880e35b0fbfc53ff5f5e239b44332.webp)


### Diagnosis Procedures
![](images/c30304e105e0b7aaae9fb0629fdcc3d0f641de671c87252edb227d8085b50e21.webp)

![](images/90ea617fdc3b8cf29aef2669d9f39da4f3f491dad4c34d67948de8d1bf8e08cd.webp)


### Trouble Code and Symptom
![](images/ce86bd4623b6dc000a9db71dc5838150e89f6f58ddfa3c64212800a04d35acf7.webp)


### Diagnosis Procedures
![](images/f84efabb483bdd81bc1a7d91f4894515a106a394926f0d05fa1c14ef7b23e8c1.webp)

![](images/01e0d1f0cb57b4a93f6229aac9c077fd8a9f95d68908e15d950aaa0bd153773c.webp)


### Trouble Code and Symptom
![](images/1ab22b487c7a4ac05e0e46839442c493e25be7eb210783827ae09b032686f888.webp)


### Diagnosis Procedures
![](images/6b58c7942d31a2274bfe3dcbf3006b9902cb634cb3d0b01a7595eaa0bae6760f.webp)

![](images/6814ec6f20623682c323ff89a7634c00157b9105e82ffa91b99276b4c3c0f28a.webp)


### Trouble Code and Symptom
![](images/bb88069c882588f3a190d7f6b6f218fbe304e1aa12f38b7ec82584c42d91bf3f.webp)


### Diagnosis Procedures
![](images/07a4652866e46bde2b71eaae52045a78d3f7adceb6df2d5ca1b744f5445ffb8f.webp)

![](images/034a445aeb8182120f49e8fcd0967af5be7ce09c6d9c75f43919ba0454386d75.webp)


### Trouble Code and Symptom
![](images/ab1894491e61fe67496cb96f9c9eca1bc5631ab0d036215f46aea74f4f18c661.webp)


### Diagnosis Procedures
![](images/0eb7fe1b3b29d9a74485e4c92ff59c104a430fc628bb3aa9505716afd8b6fc20.webp)

![](images/9f606e03c7750c0085be5575de399d9046fa45ddb02b673205689c0dd37df04c.webp)


### Trouble Code and Symptom
![](images/9a5bb64202715d7a0e6c5a9f835bb5fe644d03ae49ca000e67bef9c1e28ec8d0.webp)


### Diagnosis Procedures
![](images/ee28ec4290396acf379f5187074c28ed22b2b5b32ac6fb578aa9b7bf4312674c.webp)

![](images/12eb44673bbaca0e3f131efc2307177a3581d2674aed1c0949468b35bdc4b89b.webp)


### Trouble Code and Symptom
![](images/b297f2a30e5cb8b313c06eab6c435afa7ca4b740056dcf04c0b54164b7b9555e.webp)


### Diagnosis Procedures
![](images/3d9724cc9e1c41c6f44d54171f8e4a631c39f4a02e82670506b6db3780fa81fb.webp)

![](images/4c56d95291a07b90320202bc797080e478b9e6127456ea7b1c155f766b51803d.webp)


### Trouble Code and Symptom
![](images/a524f101c80b73b3d4be3c1502609e3e034f52018ac6a970e5741ca6592c9e3e.webp)


### Diagnosis Procedures
![](images/502f77a776a8f110b73cc7e1fe1863378121648001fd8b72c9b6a6841cc4fb5d.webp)

![](images/de880707df7bfdd4049a56f3051034b6046df55a02759a88d5de5aad1b5e93c4.webp)


### Trouble Code and Symptom
![](images/82f7a081ec5476bb5ce27a23f00fac7045eb1ec98118d29863110a63e8c8af7d.webp)


### Diagnosis Procedures
![](images/24e4560d4210971a273d996fb00b76abaab2ff120b1067619daa482285f1bbef.webp)

![](images/a5313072b3dd68ac547746e5b4122f95637335db408d6be2999116c2fe4a4b28.webp)


### Trouble Code and Symptom
![](images/2dcad6f7162641b278f76ce40b3589da356f3cd5b38b59cfb9c795560942397e.webp)


### Diagnosis Procedures
![](images/4201ea60659b3516c64f1e2841f3e755bc16c8222fbe8125b1e9a82befe52f87.webp)

![](images/c046cdaeda70a83b689b8e8a2eec71bbceaca29068fa477c8c41792c7d202ebf.webp)


### Trouble Code and Symptom
![](images/c3b19b8b78d18f2e1b6844cdb2bb4223e9a8ed20850e4d8b8b8ab083fd8299b7.webp)


### Diagnosis Procedures
![](images/f43f5e5daa169a1c11c19905f07693eaed30057f2c11a1ae4cfe886d41373e30.webp)

![](images/27e7c2b6c296f93d606c893df2c235ec687c146c0dc2d3a4e14258c3722a7e87.webp)

![](images/5fab88a7b8623fc5e9ff6c72045001ecffa684f20c6c13ed5466e6c4b2268087.webp)


### Trouble Code and Symptom
![](images/68b57a2b85c5c079247264e347c4c9812221c1fde1e2e5bb157808145d044801.webp)


### Diagnosis Procedures
Rail Pressure Control

![](images/7b3f41edd5fbe8d319f0a42c21d9b8651473392549f4e3615fa52c19c2ad75d3.webp)

![](images/90b8b248adef2d12356abd33abfd1e89d5258725d6ba79021f1e1efb678e40ab.webp)

Transfer Fuel System


### 3 High Pressyre Fuel System
![](images/3470e244072e5b07af3c5c99efa69bc42c301770addfe92add0b4ead8af6fd31.webp)

![](images/afe3b6a29ec6366103b7b34100fd48b70353e570ee8f137017cd09fbfb8f6744.webp)

![](images/d1822f845358c64a370b7f1820d987165d961ee738419f62871107a063d0fdd2.webp)


### Trouble Code and Symptom
![](images/40aa3c7c7f9c054c495119b1fc245573a0cc071b65fdaa5515065b7c9afcbba5.webp)


### Diagnosis Procedures
Diagnosis Procedures (Rail Pressure Control)

![](images/2afc82d4dc00507ad54884be133d1cae7dfa500571099422db074d65444bae9c.webp)

![](images/2b2c19549ebd5f89ac84413b612d42ef16fd8c42b6a2b41e4588df8f0cbea3c4.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/64e436fc1a2affa71f18cc094e657bace06f664e9830ab0e94b1bf979c76bb85.webp)

3. Diagnosis Procedures (High Pressure Fuel System)

![](images/560b5e50c9a95136ea000343c1a5ddc0debb5b1c8f056cb2024899aafadfa6ad.webp)

![](images/8e5e8d8354807144ad2e10958d4b4d9bc7a07043c712aff0520157b101d4e98b.webp)


### Trouble Code and Symptom
![](images/ecd457455b18fb86e2abb46a48fc4cca2e7cbac0c5dfa2cb3f10ac24159c8534.webp)


### Diagnosis Procedures
Diagnosis Procedures (Rail Pressure Control)

![](images/ea1cf0a37a9a4f7aa7caeeb4dc82568bc8e5939b19b2a81f2fa8ef9a68dca8ed.webp)

![](images/f68555b329fa57698e838e396d6bbc8fea9511dec1b679d21a51976cd25fb99e.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/709639aff6fc982b708d3e095de83d6e4a2d02008efc47965b3bb6e782aeb4e0.webp)

Diagnosis Procedures (High Pressyre Fuel System)

![](images/0fd337f3d34961bf3301f26976b37e23e88191dc12bdaf8df8f089b9b58cb32d.webp)

![](images/ba5937a29d9e6c2522395bdda2689a70dc9de89d62709acceb6dcfa3deaec8c8.webp)


### Trouble Code and Symptom
![](images/269f420a63d515ef81167f4fe2bb63f41f796c5ebef1ef8f558c1c06503d31bb.webp)


### Diagnosis Procedures
![](images/b285ca78028e92e9ecc7350752b7c22603af707590904b204f072a69ac30155d.webp)

![](images/3206999224e06a0e259438139313b4b0158458ea6f847db328df60a44eea96bd.webp)


### Trouble Code and Symptom
![](images/746c9b86b384652dda3ed875cde427820ab7e39ef572ee873440ea1949591e3c.webp)


### Diagnosis Procedures
![](images/979c086e81c21d844c96cf4565b6d388000eccc8427274028ad121b89226e759.webp)

![](images/47d2fae1eead7dced470985361ada3d8477549e90ec28fc55000c7f34a9c50c5.webp)


### Trouble Code and Symptom
![](images/51af301bee3d0f344756d389359eab80259f155bd7dcc5a7926b37e0dfe400b7.webp)


### Trouble Code and Symptom
![](images/e03d52317038b3478b220af20bcfde047e09cde4697e6fccc9e83d35493623b1.webp)


### Diagnosis Procedures
![](images/3c6cd5395172b7ab8c405ee8fb025f5732c83caaf3eae6348710b86ab6d10e73.webp)


### Trouble Code and Symptom
![](images/8ad28f6a5e851b06973b87b9d883425b1b89925aab6dbc491d486311071c412a.webp)


### Trouble Code and Symptom
![](images/eee53167ac99428784c1f6086444baefc38b16ee2daf7534fa133f04abab4fb7.webp)


### Diagnosis Procedures
![](images/79f4f570270ca1aa54d179f2f7180ca64dc32a6eb0e7f74d04b0fd08e604c095.webp)

![](images/035eb1799da5569d15fe162991d893fdf29c89d5625e91c7ae400a231664efec.webp)


### Trouble Code and Symptom
![](images/8ec627da8fefa615eaedd1b4cfadb8bf1c2d89faa096009bfb686e982f0750b5.webp)


### Diagnosis Procedures
![](images/8c615f9413eeb3c733e94bccdb909a8e1da4e530ebf4dc26fc62a36fa98635bf.webp)


### Trouble Code and Symptom
![](images/9d2bc310a15784d52ae406e24d16002a0e52f4879e9ab98f38d70cdfd87a0fef.webp)


### Diagnosis Procedures
1. Diagnosis Procedures (Rail Pressure Control)

![](images/9bd1629b1b1b9e86379b925e48891e38c620348b5d9ecb9d5c612015e3db5484.webp)

![](images/4aa54d533d24fc422a48487abebcab31dd4023887d641290567ff2dc55c788dd.webp)

Diagnosis Procedures (Transfer Fuel System)

![](images/83c95fc6e7c6a72c0fa2d667f7eb048f9b6dc23a4d1a934820a777d4d3bb0500.webp)

Diagnosis Procedures (High Pressyre Fuel System)

![](images/f0802fc2628e47c79169820be058f39aa24cfd58d60610f26b8c8e8ade0f613e.webp)

![](images/88c50f6fff178182b764f7a8fed83be1ffe12b6b7e798d30ca46577d6d10da6e.webp)


### Trouble Code and Symptom
![](images/e08a71aa0eca1ff2c26ab60109305c87f6db0b538b4cf625ef394cf1501da580.webp)


### Diagnosis Procedures
![](images/3a5c2d7cd0e8ea8acadec4440e8c74f6e8200a59a7a9c81981e8b6bf8e16b67f.webp)

![](images/850673cd650a1fb66860c3475ba9998d71b871c02371045d9d796c5ddd20a72f.webp)


### Trouble Code and Symptom
![](images/b583c1f55ab4449f325da0ae8668b6570d6bc913be4a8e59ea25d8e46c54cdd1.webp)


### Diagnosis Procedures
![](images/5c6f2d7f00a113a00d415586a6c5faa599479f9f0290868b464411471fd12081.webp)

![](images/0181b71730fc91ecd625e17ac7b992c77dfafb1c54ad11ca5bd057bbe955e73a.webp)

![](images/3ab1ca8143499e9458dadcef8d058902e1ba39733470a21768a2067725e1c8b4.webp)


### Trouble Code and Symptom
![](images/5ad9d7051e3a34b596bc29214d172f16e86fc8e7686a3bb16d987c66d0e3e40c.webp)


### Diagnosis Procedures
![](images/2439ca927bb74891a820f06d09a69df3d79006d80a3eccc71a159de2396b40c9.webp)

![](images/317700a070a665494d6bb0f58ea5a73db26cb908034f0d391363d094359081bb.webp)


### Trouble Code and Symptom
![](images/2d0c958bfa412b3115c8257f1a0f46d353193545f8449e612e828c21f186a174.webp)


### Diagnosis Procedures
![](images/b085adda1334a709955ca27432986b086570ae4c95e3daa51e28ee371a85d0fb.webp)

![](images/43623afbe2ebb81b50e2fb4caeac92b7f04f04d3142fd8bf171ca6cb7b698fd2.webp)


### Trouble Code and Symptom
![](images/18f744a9db9680a6aefb7f9cda125f3a5d5b9c55a1a46c9922981e731f6bfc37.webp)


### Diagnosis Procedures
![](images/16eee7d6e37efeee17884f6265b0fb73b56e295f58b761480d96332b37548373.webp)

![](images/2f507617d4a0c022fccbd4089c7a36e1c7f1f4717c3826f282d9cf1c841a180b.webp)


### Trouble Code and Symptom
![](images/946aeda0ef622e8471fbd9f11c54e88893d58030facc52c6b5f81fd1043ffa71.webp)


### Diagnosis Procedures
![](images/ce20a6292ee094908f07f51f8f75e3e5f17d8afd4d5026683b47cfe176445b2b.webp)

![](images/522286b41e6cb0345c54f79a78c4140e309c45ca3987ab890eb2225448b49a63.webp)


### Trouble Code and Symptom
![](images/b9e0740e08cff20ac4671a6d59bc3bc6fdb084d004d7b05dde29ac79013eafef.webp)

![](images/0e52076c5fd50db87e0eaa56f5accc9c340d1a4fb93f65e0588affb1ffcc023b.webp)


### Diagnosis Procedures
![](images/9b1c1278d50d9dfbda9687b046db8fce87953775991a5a0d20cd37f9fd5995d2.webp)

![](images/c3bbce2accfd22337cb13b733412464e1bb0e0174032b6a154cf789fd6dce893.webp)


### Trouble Code and Symptom
![](images/cd7776ff7d193ce3202c08aa327d1470910caf5faf367b9091f33a5e3bcb058a.webp)

![](images/ebcb54c9e9975bdb72175c127d2d9a96b7e7dc3d5a6cdb21ae44654ee6de1598.webp)


### Diagnosis Procedures
![](images/c5e5e6da2a075ee819064a247e04eeb3d93e9c83498bfc21a3ec06a57c2a4738.webp)

![](images/abb0b4280098628f0a72cbbfce551d480a0385f223c4a961c99c4aaae912fd25.webp)


### Trouble Code and Symptom
![](images/a5e83b7cd7425fea8117c956a0e4fb8382cb1e04b05ed7748a47981d06efbe66.webp)


### Diagnosis Procedures
![](images/f479ef3715b41c90cc66ea3bfa2f059043ed6bc5ef9570f33288d770c87aa132.webp)

![](images/aeab859fc4e92b18bf30b5d8d05dec0eaaab02011926d17d6a031eaec0c90b0a.webp)


### Trouble Code and Symptom
![](images/f067cc89aa3d2eba37c08480319a49a2c0ede77dbe09de3b25993c9b4fc738f1.webp)


### Diagnosis Procedures
![](images/24e0dee337a8cd603279bd9cf47cf7ea7bb8cdf53e0370ee898869c78f0ca4aa.webp)

![](images/501463edfd965207b214bba8f715890666d5f11a7d4398435dd26569f42d1bbf.webp)


### Trouble Code and Symptom
![](images/4e340a258f29053824bf8acf7d6a415ca10936d80d88696776defc1bf8572bf4.webp)


### Diagnosis Procedures
![](images/ded9e99de8b897740afe88b2693070236796d5917c93d591012c3243066081e3.webp)

![](images/840001ede21cb37bef3b86ed3ad56a8ebdcb333d1d2ec21097a120f93524ac02.webp)


### Trouble Code and Symptom
![](images/06560351b06c956bcd1818d50f49d452f6f9cb331b93fba90727e424658825af.webp)


### Diagnosis Procedures
![](images/b02709bcbf43b2ef0bf2a734f599cfaa1c81b60d853777074fbd2c407e76299c.webp)

![](images/3a47d21fdb1f8438f62be8db3a7f7c353f3b067b14cbd205e929d36239b2a03c.webp)


### Trouble Code and Symptom
![](images/1922cbd8f946f20dd7230e274e3741dc48e256f8f8f4281b33f6a465e2783245.webp)


### Diagnosis Procedures
![](images/603f00f0041f2a9a3a3ee2f90035363c6e652ebf47046721bb83e732bd2cace2.webp)

![](images/ae2ce28e60a5539e73f4f7e8cf4ba22b19d82a4e62464f01c47f475160f093eb.webp)

Turbo Charger Actuator Operation Fault (signal)


### Trouble Code and Symptom
![](images/c538dfcd47778ab4b9c8cb63f529dfe784b904903ea9888618a136bb58adb370.webp)


### Diagnosis Procedures
![](images/212869eed39c6299e4b335478056ad7ed09521da5433dc375f9d8eb680933fe9.webp)

![](images/27df63d8b345d4a3b985102055ce9ad2e6eeccecbde3606b7ad01135b740c8a8.webp)


### Trouble Code and Symptom
![](images/ad6bdea52fd24e4cbddd528d4c5a8dae4693a44fef9d796d14bbed2080ede66f.webp)


### Diagnosis Procedures
![](images/edefa031e293665f5612b4fad1e9335710cbcb4a02dd87a0cbf0a909b94b7dc4.webp)

![](images/c707df36710244c9aed52b8a8c1593f97b141ddcc07ca3b54f3ea3760a52c82a.webp)


### Trouble Code and Symptom
![](images/ee0e9f2c5246bb5dbb2f0395b8035edf4acc20fdde5c337251a8f33365cf7727.webp)


### Diagnosis Procedures
![](images/28522531f05d488540c6d88f1f8b9f162d840a189b1651fb4b90777107b98d88.webp)

![](images/4089dd7a59fdf2ada5beea03fd84b482b127304619160c96bc1b454291e8a6a7.webp)


### Trouble Code and Symptom
![](images/e6dfa90bef46f7bb582f5c9b13f92ce55df87747d8ac6197cf17ab208fec676a.webp)


### Diagnosis Procedures
![](images/f30a6d8f84b8fd931e0de855836d64f6fc7210343db9b14278487c6b0e48a89a.webp)

![](images/331da09870e675bc427a8b6b04b5f81835929ccbf4dd9adb9d644a67053c6981.webp)


### Trouble Code and Symptom
![](images/f28c39258c6066f11e73ceb08be273f3eaa83ea5c98f585e82bbaba1564071ae.webp)


### Diagnosis Procedures
![](images/c7d19ec19fcd5d144b4f18785c0bf378a3c4d0319cfbfdd4cfa3bf2b9021c29e.webp)

![](images/9c9bba853fd7cba2ea3303493a4171a370cb63d1ff169553fd6202c3df7350b1.webp)


### Trouble Code and Symptom
![](images/33f7856e18f84aa8988a9f0406ab07b9098cc5e6d8c4e2f2bf6415290b89b7a6.webp)


### Diagnosis Procedures
![](images/c6753c40999ea3b424f574575657236715b8013506ff6a0fe6c25bf54d31ee3c.webp)

![](images/63877875bf37c5dfd33c42cd7736bc8973a2b9778f774407dfafab94515846ce.webp)


### Trouble Code and Symptom
![](images/770ae72d3a4cb94867905ecee4473084003615f770ab69c01a87fd9fdbda55be.webp)


### Diagnosis Procedures
Read DTC YES   
Knock Sensor Related DTC? — — Refer to "Accelerometer (Knock NO Sensor) Diagnosis"   
Vehicl driving conditions are   
not satisfy with MDP learning requirements

![](images/f1f50fdb071085e9502999bc250247fce546fed73741d7916ab2a1abfc602bd4.webp)


### Trouble Code and Symptom
![](images/c1b91d509a1d1f37246f7bc7b7bfe228c20911759da8e0feb463ecc934650532.webp)


### Diagnosis Procedures
![](images/c8fe7440a2fa2770d51af646903aa943ffba8a9eab0c34a81941bccce51dbc7d.webp)

![](images/8a367cae2486d25b03fe37092a1cf432ee69fc50bf57a6346a1ef785a760745e.webp)


### Trouble Code and Symptom
![](images/abfebe7a28ac6d2cb79763b5b209855cd5a944c937d9246684ef9ea0907b01fb.webp)


### Diagnosis Procedures
Diagnosis Procedures(Boost Pressure)

![](images/1d08fe05ee0c6250452bac3e3127313f1cff26c4b22b9567373a72eca89c2a2d.webp)

![](images/03d6bbdac50d58dd3d49b33778a73dd8844a7f0dcea449cedbfff109e8c934ec.webp)

Diagnosis Procedures(Check sensor (1))

![](images/ada411354d5d239ab95483929bac2a3dbd56f25feb4ed9fd040863080db8e4dc.webp)

![](images/9a5f02781cfe0e68445d0d3c86bf1ee5bb9ed33539ca8229131387a8bcd0dd89.webp)


### Trouble Code and Symptom
![](images/e5c7617e97939f3e6967a6bb2774d07e94c3ffb6f3bc76bcd2b035f4437b5fe7.webp)


### Diagnosis Procedures
![](images/fb67a76e11652c9f00d3a5eee43e1ba4ae975997d6f7579ae3ce5487145600fc.webp)

![](images/06eb1aea95f9b48c4b24d72043426901f87b12cde82b931bcb63d1f5c5904050.webp)


### Trouble Code and Symptom
![](images/149fb8747ffa43b7f80aeaa68448f4b0a9b479b4ae5afac2d54f6d3f99ac0d36.webp)


### Diagnosis Procedures
![](images/09163fa29e7f42fcd27ec0a8ce3de14f8cc2b2e0619d27009efb06b8ee9cac02.webp)

![](images/331b293dd6e83709b68c64085b01df1d634af1ac7620c93374feaf3a26e1dd47.webp)


### Trouble Code and Symptom
![](images/44bb5bbf85d74b3e8912c26c6ab15af91f77a9e47b5c3789bc02c12f29cd3ed2.webp)


### Diagnosis Procedures
![](images/e7f5ea61383d1a3e09ed8f2430dde1eabd3aa7396a945830069581fae6c021e5.webp)

![](images/3780835e92cdadfce859479a6fe7cddec1cfc7d01c7fef5244b02d0877a0af4e.webp)


### Trouble Code and Symptom
![](images/6ccf2a350b89e84086cd90bf69a687fe6d94f1ea5c251c14876fd84f5aed38d8.webp)


### Diagnosis Procedures
![](images/7ade1e6675fcb7fbe3916e6e2d7fa8878544ade22cd709f2eb96d7fbaa7c2584.webp)

![](images/17e5ac05f6c58e54e858969b126bf96245056c2607fda1a0880f85501613841d.webp)


### Trouble Code and Symptom
![](images/32750a7e694defbbcaaa1afbafef6ebbba9070d709c71fc090ae2a9ff65e7e06.webp)


### Diagnosis Procedures
![](images/f77d7ef84dba3e7fdbcd7682f56718fa9691f0ee2828afea7cd07d1447381f8a.webp)

![](images/01aedc22445339a51e29fd9d5b9f1d8caa459f43a72b92d7861c73bbddf8aa79.webp)


### Trouble Code and Symptom
![](images/f92f15ef50acfbca538b5543130f073e7f0cddbc957caf46721d0ee972a1f2e3.webp)


### Diagnosis Procedures
![](images/562429c734b82b17890b16badd4fa66c20eaa3afdd836afdbd1283405b152690.webp)

![](images/7f341facc54ceffd896efe394f7312e4a53709118064869f3341dfa8035dce52.webp)


### Trouble Code and Symptom
![](images/ace0872ae9358ff23f0143be7d97d9081a7a570d4556c6fff836dc45a7a09365.webp)


### Diagnosis Procedures
![](images/fc2b114227c04f043869874257d04a6ba8557cf07611bafdfc7742e64bdc45e6.webp)

![](images/f98e91c2cf0e7dacaa6855175d05b4d0d70e9b0f708ae974d59a394bde8872ff.webp)


### Trouble Code and Symptom
![](images/9d6033608921af1d9c32035d671a6e488b88c60473251f0152aabf299634cba4.webp)


### Diagnosis Procedures
![](images/e78ef799c6e3180765e614d52a4622c25837aa166c52680c86c299b3b7f34ff6.webp)

![](images/99365af206630dc9a8dc995aa42204172232e78db7394015ea2139e1df5348db.webp)


### Trouble Code and Symptom
![](images/d058d149d245fcf84a3c277b85f86bfb68587668ad3252b086e546347440c58f.webp)


### Diagnosis Procedures
![](images/ce7e9797cf2f858da016bac6b27301f2f1231dd4b57d6ede4c2f170839770519.webp)

![](images/8fbdd9e5e213fb13785d9422996f6970e49121c3a784cdbfb506546fbfb4b92b.webp)


### Trouble Code and Symptom
![](images/5635bc9bfd024954a3e38b75468ac0ee7bd4a07d2169914432e630bb9b603142.webp)


### Diagnosis Procedures
![](images/cb6c201002db39e1b2454a4739024cfebe9aead45594571a089c5dd5ec701619.webp)

![](images/ca754673997f98cd21c07b169bd3eeca7745f3e7f08bb75e5512c06cddeff336.webp)


### FUEL SYSTEM DIAGNOSIS
OVERVIEW .. .. DI10-178   
Fuel pressure system DI10-179   
Fuel system pressure test DI10-182   
Fuel system check process DI10-184

![](images/71df3fe68ee5385e063b3c2ddb2a9b966c754ec20a07dc9c4e6a5559ce3eae12.webp)


### OVERVIEW
When the Diagnostic Trouble Code (DTC) is detected through scan tool, it's necessary to check the transfer and hig ressure fuel lines in fuel system before replacing the components.

If the trouble continues even after the trouble has been fixed with scan tool, must perform the fuel pressure test.   
Below schematic diagram shows the specifications of pressure, flow mass and temperature in fuel system.

![](images/6a315726027a24f0dc43c0f9b274a066d126fdde486fdb746a0e06fd2d82e69a.webp)

![](images/67d83765bd3d98b864ab624e9084d6684098de8db70fe3d1a5db461ef7de4d9c.webp)


### FUEL PRESSURE SYSTEM
![](images/9e54bb16458e1631f84363da6bb65a86650f1d7b2de1bba7103802e942df904d.webp)

Y220_10063

![](images/6d45f25794f53572e339a3791cf8c01331b1728535715e5633eb9c2a74cf4a48.webp)


### Example of Too Much Injector Back leak
![](images/e6bc3b310b41cd0d05db1e014f630bca3b07d4d4b148b8e337d76fa60530fa7a.webp)

Y220_10064


### Too Much Injector Back leak
When the injector cannot be sealed due to entering the foreign materials


### Ex.:
• Foreign materials in fuel •Burnt out or worn high pressure pump •Mechanical damage in inside of injector

![](images/d542c90b148d61efdf001a65a4f2af04d9d2e2d9988724525267a746ba3229f2.webp)


### Example of Pressure/Volume Loss in Pump
![](images/d1ad6c5e811eeab0966a5802af5ddd41173803ce0b548f5d201d9b1eac2748b9.webp)

Y220_10065


### Pressure/Volume Loss in High Pressure Pump
When the required target pressure/volume cannot be delivered due to fuel supplyline or pump damage


### Ex.:
•Air in fuel supply line Excessive vacuum pressure in fuel supply line (-300 mbar) •Burnt out or mechanically damaged pump •Supply fuel with increased temperature ( > 65°C)

![](images/c877bb798472b540120261f1577602953788871699f89c36783de3080e3d56a4.webp)


### FUEL SYSTEM PRESSURE TEST
Test Tool Kit

For High Pressure Line

![](images/61c3c23399ab0399bcc1d11b04ecf5d62e43926dcbc544b7eb2bca69bc54123e.webp)

Y220_10066


### For Transfer Line
![](images/d06601555c30503c6a6486276f149975e9ebdb74cd72d921e6879d47718dec2e.webp)

Y220_10067

![](images/db5870edd9bf8ed24e0112e980a5a842d42fcd64939e1b223c0b1938fcbd69ab.webp)


### Prerequisite
1.Check the connections in fuel supply lines.   
Check the fuel level in fuel tank.   
Check if the air exists in fuel supply lines (air bubbles in fuel supply lines or fuel with air bubbles).   
4.Check the fuel supply lines for leaks (transfer and high pressure).   
Check if the specified fuel is used.   
6Check the fuel filter for contamination and abnormality.


### Fuel System Test Process
![](images/7c145e03614c5ec7e72709e3f251bab3e209af670c44858c87568c31437f3b37.webp)

Notice

If more than one DTC have been detected, check the wiring harness for open or short first.

Check the transfer fuel system and fuel filter before proceeding the high pressure fuel system check in next page.

![](images/a475642d173ee6a532cd600ab26dd42e2425080b74b7d0d4fc8b50026d909750.webp)


### FUEL SYSTEM CHECK PROCESS
Initial Check Transfer fuel system (air in system), specified fuel used Fuel leaks, fuel filter Diagnostic Trouble Code •Wiring harness •Abnormal noise from injector No Abnormality No Check and repair in Initial Check? Yes Check fuel rail pressure (refer to 4-1) When cranking engine for 5 seconds after disconnecting IMV connector, i the rail pressure over 1,050 bar? Check transfer fuel system (refer to 4-2) Yes Install the transparent tube between fuel > filter and priming pump. Check the transfer felsystem for clogged oir bubbles. Check i the vacuum pressure is proper. No Thoroughly clean the components before installation Check the injector back leak volume   
Method 1 Method 2 Static Test for Injector Back leak Volume Dynamic Test for Injector Back leak Volume (refer to 4-4) (refer to 4-3) (with engine cranking but not running) 1. Warm up engine (coolant temp.: over 60°C), place an (with engine running)   
Place an empty plastic container under the return of empty plastic container under the return of injector, and   
injector: start engine.   
Remove IMV and injector connectors, crank for 5 2. Run the engine for 30 seconds at idle speed, perform :   
seconds, and check the injector back leak volume. fuel system pressure leakage test” with Scan-i, and   
The fuel length in tube should be over 20 cm. check the fuel level in container. It should be over 38 ml. High Pressure Pump Test (refer to 4-5) No Install the closed rail into high pressure No pump at outlet port. Remove IMV connector and crank engine for 5 seconds. Is the presYes sure over 1,050 bar? Yes Replace the injector Replace the injector   
Enter new injector C2I data into ECU Enter new injector C2I data into ECU after replacing the injector after replacing the injector Perform the initial check again. Yes No Replace high pressure pump

![](images/5f7ceacd11795a840c0e1549d1306623223adb75faf9e7bd6b7f6077cc104b80.webp)


### Fuel Rail Pressure Test
1. Disconnect the fuel rail pressure sensor connector and IMV connector.

![](images/b12ef1af020f1829c8da89baa2102d427625875b3ab90c422ce5eb357283b4d8.webp)

2. Install the pressure tester in tool kit to the fuel rail pressure sensor connector.

![](images/f4c067338f3692cac2486d4163bc0faa11c74b1d7f23eb8aa0bc7f1950565699.webp)

Crank the engine for 5 seconds (twice).

-Read the maximum pressure displayed on the tester. -If the maximum pressure is below 1,050 bar, refer to “Fuel System Check Process” section.

![](images/b63051cc18933e1d8e4de8659d1e7f90ae2bab40050457d52cb9e176433f4030.webp)

![](images/1f2b6a410b3dfe1ae466809cee7ed181fa9ac92e7b1b48b7cc8de55370865be7.webp)

![](images/c42060c1d37af5d096ea949079d08877c19a20f309b9a9bb88070d213ea187ae.webp)


### How To Use Pressure Tester
1Check if the “TEST?" is displayed on the display when pressing the “Test " button.

The maximum pressure will be displayed when pressing the button while cranking the engine (around 4 seconds elapsed from 5 seconds).


> ℹ️ **Примечание:** The fuel rail pressure can be measured through the scan tool.
>
> ![](images/0c364d65fe2d8282545a31734d560d6954ca7bdc53a3e1a0548e295a80813d25.webp)


### Test Procedures
1. All wiring harnesses, connectors and fuel lines should be installed properly and the engine should be ready to start.

2. Prepare the special tools for transfer fuel system test and thoroughly clean the system.

![](images/823106fb3522be256fe8f0b18f5b62acd411e21a1456b077108cc449b39d8282.webp)

Disconnect the key connector for connecting the priming pump to fuel fiter and install both connectors of the special tool to the fuel pump and the priming pump hoses.

![](images/e404028400042ef8ef8d12eb906cd66003702dfeea8592f8471fcf0f96cbe0f1.webp)

Y220_10074

Start the engine and visually check the transfer line for clogged and air bubbles while running the engine at idle speed. If the fuel flows are not smooth or air bubbles are found in fuel lines, locate the leaking area and correct it.

![](images/017141f2b3a427513c1fe8bdf3017501f5c2b2a950bb7e3ab4d9be250eafa3b1.webp)


### 4-3. Static Test for Injector Back leak Volume
Remove the injector return hose and seal the openings with screw type caps (included in tool kit).

![](images/bc02b9b868f7b2000c7061d4de1214320607a864711537796d0b7092ea2bc9e0.webp)

![](images/4f5e716b49345de898f0ac850593580025bba1b283ea71227c8400d0471f012a.webp)

Install the hoses from back leak test containers to return nipples of injector.

3. Disconnect the IMV connector in H/P pump and the fuel pressure sensor connector.

![](images/316617749ed081900aa8403e07095e7d7cb4f731f4b98a75771ead2fca4c14de.webp)

4.Crank the engine twice with 5 seconds of interval.

5Check if the back leak volume meets the specification.

![](images/f1fa920b557ad17d2330abc497f270cd2f29b2c2f4d8845b2a467f6180cac690.webp)

20cm 20cm , Y220_10079


### If the measured value is out of specified value, replace the injector.
![](images/e9954e11b6e24f970360bbb6dfea84ac5b0a4ab70b3a69c8046d536b7c3c65cc.webp)


### 4-4. Dynamic Test for Injector Back leak Volume
1.Start the engine and warm up until the coolant temperature reaches to 60°C.   
Remove the injector return hose and seal the openings with screw type caps (included in tool kit).

![](images/96b5e7dbbc99ef2ee6f952a60f17f48846e3975c27fd7ccda387fc1bff6324f6.webp)

![](images/9234b0b64fa456696f0b776c40532c8664378852331c287bc28a9e4e3c3dd7dd.webp)

3. Install the hoses from back leak test containers to return nipples of injector.

Start the engine and let it run for 2 minutes at idle speed.

5Check if the back leak volume meets the specification.

![](images/f18c914b4aa188f92654971d7436f3519480e310b0b81d3c10386f1a6fcadf57.webp)

4R.22 00ml 3F1. 60ml 2R.00 ← 40ml IRe 20ml Y220_10082

![](images/f45cf792ca2cfc2c1af29df594b97287123ff4d1e97d1d5a8dac11f2223daead.webp)


### PRESSURE LEAKAGE TEST WITH SCAN-100
When performing the static test for injector back leak Volume, the fuel pressure leakage test with Scan-i should be done simultaneously. And, the fuel pressure leakage test with Scan-i can be done separately.

. Test Conditions:

•No defective or faulty sensors and components in fuel system: checked by Scan-i • Coolant temperature: over 60°C

3The diagnosis procedures with Scan-i are as below:

1) Install the Scan-i to the diagnostic connector. Select “DIAGNOSTICS” and press “ENTER” in “MAIN MENU" screen. Select “REXTON'” and press “ENTER” in “VEHICLE SELECTION” screen.

![](images/bcebedec7b8a1986a8d8d1729aed8cc6664096f28fdc835f3b6eea57eca69a9c.webp)

2) Select “ECU” and press “ENTER” in “CONTROL UNIT SELECTION” screen.

![](images/3d310b704d2a3552ecc5626609a6c060c4153fc9775683c01c24c9aaaba23c0c.webp)

3) Select “LEAK DETECTION" and press “ENTER” in “FUNCTION SELECTION"” screen.

![](images/140402c241c5039ee08769e0f22fad759cee541abb46f2cee03a402a216f342f.webp)

![](images/29c4d4ce93d188732dfc93c619dfccbafb3b609ee47a3a97ce12347bc9752890.webp)

SCAN - 100 LEAK DETECTION ReXtoN ECU DSL D27DT > Test Condition <<<<<<<<< - Idle Running(Vehicle Speed = 0) - Engine Temp. : 60-100°C - No Detect Battery Fault -No Detect Injector Drive Falut — No Detect IMV Drive Falut - No Detect Rail Press Falut [ENTER] : Start Leak Detection

![](images/ab10f3637c74472a4fc7ef1a984439593ae0475c7619782613e2b07eaca6d88f.webp)

4) If there are not any troubled conditions in "TEST CONDITION” screen, press “ENTER".


### 4-5 High Pressure Pump Test
1. Prepare the special tools for high pressure pump test and thoroughly clean the system.

![](images/1a87dd5603da1081876160632ce00a1a1813c438451f0f8e47dd87fcdca90815.webp)

2Remove the high pressure fuel supply pipe and install the closed rail delivered with tool kit.

![](images/00e2a91cd3bea296d05474810f7a34533100ba6d7be73ed574ed9d507e013c8c.webp)

![](images/8279cd00a0480e228ea4bb8a55aa8d546dae40c52f53412984638937e83935ac.webp)

\* The figure is to show the test method. However, the actual test operation should be done while the high pressure pump is installed in vehicle.

3. Install the opposite end of the closed rail into the fuel rail for test.

![](images/e898fa459fdb621203f23113d1de9f191603f9b4329176d15e00973e50e620a2.webp)

![](images/05ac7961fd49e2405b4ba36cbf90068ede0e46bf655676b9cdc857996e91b15c.webp)

4.Remove the high pressure fuel return hose and install the transparent tube between the high pressure pump and the return port of fuel rail for test.

![](images/a37fb33e91427623a66f9211d6b02a6ae256de0a299de93902f6763abafccf81.webp)

Y220_10086

![](images/3e4e392703b6e282d5c93cb7f0a3e1ca8965ad683f9819cc591fb845be444520.webp)

![](images/9880e283b776cdd2ffa2654966ff60ca09edf867d08d7da908ddd60571c83831.webp)

5. Connect the digital tester connector into the sensor connector of fuel rail for test.   
6Disconnect the IMV connector and the fuel rail pressure sensor connector.   
7. Check if the measured value on the digital tester meets the specified value.

![](images/14f55b1ed9d68f7c6376c7839ed9dfdf0513c518ed052a86fc1c7a3d2201c663.webp)

![](images/0ef174e474568ec59635ce2b23349b2441462f05ebbc1a20479da750ba7f63e2.webp)

Y220_10088

![](images/667cce8db7ff916f937cfc337eb07ac27d8000f6d343bdd7e815aa0df3dc4f1d.webp)

ISSUED BY INTERNATIONAL A/S TEAM SSANGYONG MOTOR CO., LTD.

150-3, CHILGOI-DONG, PYUNGTAEK-SI GYEONGGI-DO, 459-711 KOREA

TELEPHONE : 82-31-610-2740   
FACSIMILE :82-31-610-3762

NOTE: All rights reserved. Printed in SSANGYONG Motor Co., Ltd. No part of this book may be used or reproduced without the written permission of International A/S Team.

### Engine Assembly - Removal

Disconnect the negative battery cable.


### Inspection of Turbine

Thoroughly check the followings.


### #1 Exhaust Pipe Removal and Installation

1.Remove the upper bolts at turbo charger.


### Forceful relay shut-down

•When glow plug is shorted to ground


### Removal and Installation

1.Disconnect the fuel supply and return hoses.


### TROUBLE DIAGNOSIS PROCEDURES

HMF sensor Signal Fault (Electric Failure)
