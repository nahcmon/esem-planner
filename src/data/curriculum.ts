import type {
  ComponentDef,
  ExamKind,
  ExamPartDef,
  Localized,
  ModuleDef,
  TopicDef,
} from '../types'

const l = (de: string, en: string): Localized => ({ de, en })

const topics = (prefix: string, rows: [string, string][]): TopicDef[] =>
  rows.map(([de, en], index) => ({
    id: `${prefix}-t${index + 1}`,
    title: l(de, en),
  }))

const comp = (
  id: string,
  edv: string,
  de: string,
  en: string,
  sws: number,
  ects: number,
  topicRows: [string, string][],
): ComponentDef => ({
  id,
  edv,
  title: l(de, en),
  shortTitle: l(de, en),
  sws,
  ects,
  topics: topics(id, topicRows),
})

const ex = (
  id: string,
  componentId: string,
  de: string,
  en: string,
  kind: ExamKind,
  durationMin?: number,
  weight?: number,
  graded = true,
): ExamPartDef => ({
  id,
  componentId,
  label: l(de, en),
  kind,
  durationMin,
  weight,
  graded,
})

export const CURRICULUM: ModuleDef[] = [
  {
    id: 'G1',
    edv: '364010',
    semester: 1,
    title: l('Mathematik und Mechanik', 'Mathematics and Mechanics'),
    shortTitle: l('Mathe & Mechanik', 'Maths & Mechanics'),
    ects: 10,
    sws: 8,
    kind: 'fundamentals',
    accent: 'lime',
    summary: l(
      'Vektoralgebra, komplexe Zahlen, lineare Algebra und Analysis treffen auf Technische Mechanik starrer Körper – die mathematische und mechanische Basis des Studiums.',
      'Vector algebra, complex numbers, linear algebra and calculus meet rigid-body mechanics – the mathematical and mechanical foundation of the programme.',
    ),
    components: [
      comp('math1', '364011', 'Mathematik 1', 'Mathematics 1', 6, 8, [
        ['Vektoralgebra', 'Vector algebra'],
        ['Komplexe Zahlen', 'Complex numbers'],
        ['Matrizen und Determinanten', 'Matrices and determinants'],
        ['Lineare Gleichungssysteme', 'Systems of linear equations'],
        ['Folgen, Reihen und Grenzwerte', 'Sequences, series and limits'],
        ['Funktionen', 'Functions'],
        ['Differentialrechnung', 'Differential calculus'],
        ['Integralrechnung', 'Integral calculus'],
      ]),
      comp('mech1', '364012', 'Mechanik 1', 'Mechanics 1', 2, 2, [
        ['Axiome der Statik', 'Axioms of statics'],
        ['Gleichgewichtsbedingungen', 'Equilibrium conditions'],
        ['Lager und Zwischenlager', 'Supports and intermediate supports'],
        ['Ebene Fachwerke', 'Planar trusses'],
        ['Schwerpunkt', 'Centroids'],
        ['Schnitt- und Beanspruchungsgrößen', 'Internal forces and stresses'],
      ]),
    ],
    examParts: [
      ex('g1-math-exam', 'math1', 'Mathematik 1 – Klausur', 'Mathematics 1 exam', 'written', 120, 4),
      ex('g1-mech-exam', 'mech1', 'Mechanik 1 – Klausur', 'Mechanics 1 exam', 'written', 60, 1),
    ],
    literature: [
      'Westermann, T.: Mathematics for Engineers, Vol. I & II',
      'Gross, D. et al.: Engineering Mechanics 1 – Statics',
      'Laqua, E.: Formelsammlung zur Vorlesung',
    ],
  },
  {
    id: 'G2',
    edv: '364020',
    semester: 1,
    title: l('Physik', 'Physics'),
    shortTitle: l('Physik', 'Physics'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'blue',
    summary: l(
      'Klassische Physik von der Newtonschen Mechanik über Thermodynamik und Fluidmechanik bis zu Schwingungen und Variationsprinzipien.',
      'Classical physics from Newtonian mechanics through thermodynamics and fluid mechanics to oscillations and variational principles.',
    ),
    components: [
      comp('physics', '364021', 'Physik', 'Physics', 4, 5, [
        ['Physikalische Größen und Einheiten', 'Physical quantities and units'],
        ['Newtonsche Mechanik', 'Newtonian mechanics'],
        ['Thermodynamik', 'Thermodynamics'],
        ['Fluidmechanik', 'Fluid mechanics'],
        ['Variationsrechnung', 'Calculus of variations'],
        ['Schwingungen', 'Oscillations'],
      ]),
    ],
    examParts: [ex('g2-exam', 'physics', 'Physik – Klausur', 'Physics exam', 'written', 90)],
    literature: ['Tipler, P. A.: Physics for Scientists and Engineers', 'Scholle, M.: Vorlesungsunterlagen'],
  },
  {
    id: 'G3',
    edv: '364030',
    semester: 1,
    title: l('Elektrotechnik 1', 'Electrical Engineering 1'),
    shortTitle: l('Elektrotechnik 1', 'Electrical Eng. 1'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'amber',
    summary: l(
      'Gleichstromnetzwerke, Zweipole, Netzwerkanalyse, elektrische Felder, Spule und Transformator – die Grundsprache der Elektrotechnik.',
      'DC networks, two-terminal devices, network analysis, electric fields, inductors and transformers – the basic language of electrical engineering.',
    ),
    components: [
      comp('et1', '364031', 'Elektrotechnik 1', 'Electrical Engineering 1', 4, 5, [
        ['Grundbegriffe und Zweipole', 'Fundamentals and two-terminal networks'],
        ['Gleichstromnetzwerke', 'DC networks'],
        ['Methoden der Netzwerkanalyse', 'Network analysis methods'],
        ['Elektrisches Feld und Kondensator', 'Electric field and capacitor'],
        ['Magnetfeld und Spule', 'Magnetic field and inductor'],
        ['Transformator', 'Transformer'],
      ]),
    ],
    examParts: [ex('g3-exam', 'et1', 'Elektrotechnik 1 – Klausur', 'Electrical Engineering 1 exam', 'written', 120)],
  },
  {
    id: 'G4',
    edv: '364040',
    semester: 1,
    title: l('Erneuerbare Energietechnik', 'Renewable Energy Technology'),
    shortTitle: l('Erneuerbare Energien', 'Renewable Energy'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'teal',
    summary: l(
      'Solarthermie, Geothermie und Bioenergie treffen auf Photovoltaik und Windenergie – Technologien, Kennzahlen und Einsatzgrenzen.',
      'Solar thermal, geothermal and bioenergy meet photovoltaics and wind – technologies, key figures and operating limits.',
    ),
    components: [
      comp('ret-thermal', '364041', 'Bioenergie, Geothermie & Solarthermie', 'Bioenergy, Geothermal & Solar Thermal', 2, 2.5, [
        ['Solarthermie', 'Solar thermal energy'],
        ['Solarthermische Stromerzeugung', 'Concentrated solar power'],
        ['Geothermie', 'Geothermal energy'],
        ['Biomasse', 'Biomass'],
        ['Biogas', 'Biogas'],
      ]),
      comp('ret-pv', '364042', 'Photovoltaik & Windenergie', 'Photovoltaics & Wind Energy', 2, 2.5, [
        ['PV-Grundlagen und Kennlinien', 'PV fundamentals and I-V curves'],
        ['Windenergie und Rotorauslegung', 'Wind energy and rotor design'],
        ['Standortanalyse und Ertragsprognose', 'Site analysis and yield forecast'],
        ['Netzanbindung', 'Grid connection'],
      ]),
    ],
    examParts: [
      ex(
        'g4-exam',
        'ret-thermal',
        'Erneuerbare Energietechnik – Portfolioprüfung',
        'Renewable Energy Technology – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'G5',
    edv: '364050',
    semester: 1,
    title: l('Sprachen 1', 'Languages 1'),
    shortTitle: l('Sprachen 1 · Spanisch', 'Languages 1 · Spanish'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'rose',
    summary: l(
      'Sprachmodul mit 4 SWS. In diesem Plan auf Spanisch vorkonfiguriert; die Sprachwahl ist individuell. Prüfung als Sprachkompetenzprüfung (SKBK, 180 Min.).',
      'Language module with 4 contact hours. Preconfigured for Spanish in this plan; the language choice is individual. Assessment as a language competence exam (SKBK, 180 min).',
    ),
    components: [
      comp('spanish1', '364051', 'Spanisch 1', 'Spanish 1', 4, 5, [
        ['Begrüßung und Vorstellung', 'Greetings and introductions'],
        ['Ser, estar und hay', 'Ser, estar and hay'],
        ['Präsens: regelmäßige Verben', 'Present tense: regular verbs'],
        ['Präsens: unregelmäßige Verben', 'Present tense: irregular verbs'],
        ['Zahlen, Uhrzeit und Alltag', 'Numbers, time and everyday life'],
        ['Hörverstehen und Aussprache', 'Listening and pronunciation'],
        ['Kurzpräsentation', 'Short presentation'],
      ]),
    ],
    examParts: [
      ex('g5-exam', 'spanish1', 'Spanisch 1 – Sprachkompetenzprüfung', 'Spanish 1 – language competence exam', 'language', 180),
    ],
  },

  {
    id: 'G6',
    edv: '364060',
    semester: 2,
    title: l('Mathematik 2', 'Mathematics 2'),
    shortTitle: l('Mathematik 2', 'Mathematics 2'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'lime',
    summary: l(
      'Taylor- und Fourierreihen, Funktionen mehrerer Veränderlicher, partielle Differentiation, Mehrfachintegrale und Differentialgleichungen.',
      'Taylor and Fourier series, multivariable functions, partial differentiation, multiple integrals and differential equations.',
    ),
    components: [
      comp('math2', '364061', 'Mathematik 2', 'Mathematics 2', 4, 5, [
        ['Taylor- und Fourierreihen', 'Taylor and Fourier series'],
        ['Funktionen mehrerer Veränderlicher', 'Functions of several variables'],
        ['Partielle Differentiation', 'Partial differentiation'],
        ['Mehrfachintegrale', 'Multiple integrals'],
        ['Differentialgleichungen', 'Differential equations'],
      ]),
    ],
    examParts: [ex('g6-exam', 'math2', 'Mathematik 2 – Klausur', 'Mathematics 2 exam', 'written', 120)],
  },
  {
    id: 'G7',
    edv: '364070',
    semester: 2,
    title: l('Werkstoffkunde und Mechanik', 'Material Science and Mechanics'),
    shortTitle: l('Werkstoffe & Mechanik', 'Materials & Mechanics'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'sage',
    summary: l(
      'Werkstoffkunde und Technische Mechanik 2: mechanisches und elektrisches Werkstoffverhalten, Leiter, Halbleiter, Elastostatik und Kinematik.',
      'Materials science and Mechanics 2: mechanical and electrical material behaviour, conductors, semiconductors, elastostatics and kinematics.',
    ),
    components: [
      comp('materials', '364071', 'Werkstoffkunde', 'Materials Science', 2, 2.5, [
        ['Mechanisches Verhalten von Werkstoffen', 'Mechanical behaviour of materials'],
        ['Elektrisches Verhalten von Werkstoffen', 'Electrical behaviour of materials'],
        ['Leiter- und Widerstandswerkstoffe', 'Conductor and resistor materials'],
        ['Halbleiter', 'Semiconductors'],
        ['Isolier- und Dielektrikumstoffe', 'Insulating and dielectric materials'],
      ]),
      comp('mech2', '364072', 'Mechanik 2', 'Mechanics 2', 2, 2.5, [
        ['Zug- und Druckstäbe', 'Tension and compression members'],
        ['Spannungen bei gerader Biegung', 'Stresses in straight bending'],
        ['Torsion von Stäben', 'Torsion of bars'],
        ['Festigkeitsnachweis und Dimensionierung', 'Strength verification and dimensioning'],
        ['Kinematik und räumliche Bewegung', 'Kinematics and motion in space'],
      ]),
    ],
    examParts: [
      ex(
        'g7-exam',
        'materials',
        'Werkstoffkunde und Mechanik – Portfolioprüfung',
        'Material Science and Mechanics – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'G8',
    edv: '364080',
    semester: 2,
    title: l('Elektrotechnik 2', 'Electrical Engineering 2'),
    shortTitle: l('Elektrotechnik 2', 'Electrical Eng. 2'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'amber',
    summary: l(
      'Wechselstromnetzwerke, Filter, Resonanz, Dioden- und OP-Schaltungen, Mehrphasensysteme – ergänzt durch ein Elektrotechnik-Labor.',
      'AC networks, filters, resonance, diode and op-amp circuits, polyphase systems – complemented by an electrical engineering lab.',
    ),
    components: [
      comp('et2', '364081', 'Elektrotechnik 2', 'Electrical Engineering 2', 2, 5, [
        ['Sinusstromkreise', 'Sinusoidal AC circuits'],
        ['Netzwerke bei Sinusspannung', 'Networks under sinusoidal voltage'],
        ['Hoch- und Tiefpassfilter', 'High-pass and low-pass filters'],
        ['Resonanzschaltungen', 'Resonant circuits'],
        ['Dioden und Operationsverstärker', 'Diodes and operational amplifiers'],
        ['Mehrphasensysteme', 'Polyphase systems'],
      ]),
      comp('et2-lab', '364082', 'Elektrotechnik-Labor', 'Electrical Engineering Laboratory', 2, 0, [
        ['Messgeräte und Oszilloskop', 'Measurement devices and oscilloscope'],
        ['Reihen- und Parallelschaltungen', 'Series and parallel circuits'],
        ['Spannungsquellen im Schaltkreis', 'Voltage sources in circuits'],
        ['Wechselstrom und passive Bauelemente', 'AC and passive components'],
        ['Schaltvorgänge an L und C', 'Transients in inductors and capacitors'],
      ]),
    ],
    examParts: [
      ex('g8-exam', 'et2', 'Elektrotechnik 2 – Klausur', 'Electrical Engineering 2 exam', 'written', 90),
      ex('g8-lab', 'et2-lab', 'Elektrotechnik-Labor – Leistungsnachweis', 'Electrical Engineering Lab – course achievement', 'lab', undefined, undefined, false),
    ],
  },
  {
    id: 'G9',
    edv: '364090',
    semester: 2,
    title: l('Grundlagen der Informatik', 'Fundamentals of Information Technology'),
    shortTitle: l('Informatik', 'Information Technology'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'violet',
    summary: l(
      'Softwareentwicklung, Algorithmen, objektorientierte Programmierung, UI-Konzeption, Debugging und Software Engineering.',
      'Software development, algorithms, object-oriented programming, UI design, debugging and software engineering.',
    ),
    components: [
      comp('informatics', '364091', 'Angewandte Informatik', 'Applied Computer Science', 4, 5, [
        ['Software, Algorithmen und Programmiersprachen', 'Software, algorithms and programming languages'],
        ['Softwareentwicklungsprozess', 'Software development process'],
        ['Objektorientierte Programmierung', 'Object-oriented programming'],
        ['Entwicklungsumgebung und Debugging', 'IDE and debugging'],
        ['Benutzeroberflächen konzipieren', 'Designing user interfaces'],
        ['Rekursion und Backtracking', 'Recursion and backtracking'],
        ['Software Engineering', 'Software engineering'],
      ]),
    ],
    examParts: [ex('g9-exam', 'informatics', 'Angewandte Informatik – Klausur', 'Applied Computer Science exam', 'written', 120)],
  },
  {
    id: 'G10',
    edv: '364100',
    semester: 2,
    title: l('Grundlagen der Energieversorgung', 'Fundamentals of Energy Supply'),
    shortTitle: l('Energieversorgung', 'Energy Supply'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'teal',
    summary: l(
      'Liberalisierte Energiemärkte, EEX-Preisbildung, Transport und Verteilung, Endkundenpreise, Prognose und Geschäftsmodelle.',
      'Liberalised energy markets, EEX price formation, transport and distribution, end-customer pricing, forecasting and business models.',
    ),
    components: [
      comp('energy-markets', '364101', 'Liberalisierte Energie- und Rohstoffmärkte', 'Liberalised Energy and Raw Materials Markets', 2, 2.5, [
        ['Rahmenbedingungen leitungsgebundener Energien', 'Framework of grid-bound energy'],
        ['Preisbildung an der EEX', 'Price formation at EEX'],
        ['Energietransport und -verteilung', 'Energy transport and distribution'],
        ['Endkundenpreise', 'End-customer pricing'],
        ['Preisprognose', 'Price forecasting'],
        ['Geschäftsmodelle der Energiewirtschaft', 'Energy business models'],
      ]),
      comp('energy-grids', '364102', 'Öffentliche Versorgungsnetze', 'Public Supply Grids', 2, 2.5, [
        ['Rohstoffe', 'Raw materials'],
        ['Wasserwirtschaft', 'Water utilities'],
        ['Stromnetze', 'Electricity grids'],
        ['Erdgas- und Erdölnetze', 'Gas and oil grids'],
        ['Wasserstoff', 'Hydrogen'],
      ]),
    ],
    examParts: [
      ex(
        'g10-exam',
        'energy-markets',
        'Energieversorgung – Portfolioprüfung',
        'Energy Supply – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'G11',
    edv: '364000',
    semester: 2,
    title: l('Sprachen 2', 'Languages 2'),
    shortTitle: l('Sprachen 2 · Spanisch', 'Languages 2 · Spanish'),
    ects: 5,
    sws: 4,
    kind: 'fundamentals',
    accent: 'rose',
    summary: l(
      'Zweites Sprachmodul mit 4 SWS, im Plan als Spanisch-Fortsetzung vorgesehen. Prüfung als Sprachkompetenzprüfung (SKBK, 180 Min.).',
      'Second language module with 4 contact hours, continued in Spanish in this plan. Assessment as a language competence exam (SKBK, 180 min).',
    ),
    components: [
      comp('spanish2', '364001', 'Spanisch 2', 'Spanish 2', 4, 5, [
        ['Vergangenheitszeiten', 'Past tenses'],
        ['Objektpronomen', 'Object pronouns'],
        ['Alltag und Studium', 'Everyday life and studies'],
        ['Textproduktion', 'Writing'],
        ['Diskussion und Meinung', 'Discussion and opinions'],
        ['Präsentation', 'Presentation'],
      ]),
    ],
    examParts: [
      ex('g11-exam', 'spanish2', 'Spanisch 2 – Sprachkompetenzprüfung', 'Spanish 2 – language competence exam', 'language', 180),
    ],
  },

  {
    id: 'H1',
    edv: '364110',
    semester: 3,
    title: l('Automatisierungs- und Kommunikationstechnik', 'Automation and Communication Technology'),
    shortTitle: l('Automation & Kommunikation', 'Automation & Communication'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'violet',
    summary: l(
      'Automatisierungstechnik, Prozessleitsysteme, Sensorik und Aktorik, SPS, Gebäudeautomation und Kommunikationsbusse.',
      'Automation technology, process control systems, sensors and actuators, PLCs, building automation and communication buses.',
    ),
    components: [
      comp('automation', '364111', 'Automatisierungssysteme', 'Automation Systems', 2, 2.5, [
        ['Einführung in die Automatisierungstechnik', 'Introduction to automation'],
        ['Automatisierungsrechner und Prozessleitsysteme', 'Automation computers and DCS'],
        ['Sensoren und Aktoren', 'Sensors and actuators'],
        ['SPS und Maschinenautomatisierung', 'PLC and machine automation'],
        ['Gebäudeautomation und Busse', 'Building automation and buses'],
      ]),
      comp('communication', '364112', 'Kommunikationstechnik', 'Communication Technology', 2, 2.5, [
        ['Standardisierung und Normung', 'Standardisation and norms'],
        ['Topologie und Datenübertragung', 'Topology and data transmission'],
        ['Synchronisation und Multiplexing', 'Synchronisation and multiplexing'],
        ['Modulation, Kodierung, Kompression', 'Modulation, coding, compression'],
        ['Datensicherung und Verschlüsselung', 'Data security and encryption'],
      ]),
    ],
    examParts: [
      ex(
        'h1-exam',
        'automation',
        'Automation und Kommunikation – Portfolioprüfung',
        'Automation and Communication – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'H2',
    edv: '364120',
    semester: 3,
    title: l('Elektronik und Messtechnik', 'Electronics and Measurement Technology'),
    shortTitle: l('Elektronik & Messtechnik', 'Electronics & Measurement'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'amber',
    summary: l(
      'Messsignale, Messunsicherheit, Strom-, Spannungs- und Leistungsmessung sowie Temperatur-, Weg-, Kraft-, Druck-, Durchfluss- und Schwingungsmessung.',
      'Measurement signals, uncertainty, current, voltage and power measurement plus temperature, displacement, force, pressure, flow and vibration measurement.',
    ),
    components: [
      comp('measurement', '364121', 'Elektronik und Messtechnik', 'Electronics and Measurement Technology', 4, 5, [
        ['Charakterisierung von Messsignalen', 'Characterisation of measurement signals'],
        ['Messmethoden und Messunsicherheit', 'Measurement methods and uncertainty'],
        ['Strom, Spannung, Leistung und Energie', 'Current, voltage, power and energy'],
        ['Temperatur-, Weg- und Drehzahlmessung', 'Temperature, displacement and speed'],
        ['Kraft, Druck und Durchfluss', 'Force, pressure and flow'],
        ['Schwingungs- und Feuchtemessung', 'Vibration and humidity measurement'],
      ]),
    ],
    examParts: [ex('h2-exam', 'measurement', 'Elektronik und Messtechnik – Klausur', 'Electronics and Measurement exam', 'written', 120)],
  },
  {
    id: 'H3',
    edv: '364130',
    semester: 3,
    title: l('Nachhaltige Energietechnik', 'Sustainable Energy Technology'),
    shortTitle: l('Nachhaltige Energietechnik', 'Sustainable Energy'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'teal',
    summary: l(
      'Energieeffizienz, Optimierung der Energieversorgung und Lastmanagement – von Indikatoren bis Demand Side Management.',
      'Energy efficiency, supply optimisation and load management – from indicators to demand side management.',
    ),
    components: [
      comp('optimize-supply', '364131', 'Optimierung der Energieversorgung', 'Optimizing of Energy Supply', 2, 2.5, [
        ['Energieeffizienz: Definitionen und Indikatoren', 'Energy efficiency: definitions and indicators'],
        ['Effizienzpotenziale und Hemmnisse', 'Efficiency potentials and barriers'],
        ['Energiebilanzen und Kennzahlen', 'Energy balances and KPIs'],
        ['Bewertung von Effizienzmaßnahmen', 'Evaluating efficiency measures'],
      ]),
      comp('demand-side', '364132', 'Demand Side Management', 'Demand Side Management', 2, 2.5, [
        ['Energiekosten und Einsparungen', 'Energy costs and savings'],
        ['Lastprofile und Lastverschiebung', 'Load profiles and load shifting'],
        ['Flexibilität und Speicher', 'Flexibility and storage'],
        ['Regulatorische Rahmenbedingungen', 'Regulatory framework'],
      ]),
    ],
    examParts: [
      ex(
        'h3-exam',
        'optimize-supply',
        'Nachhaltige Energietechnik – Portfolioprüfung',
        'Sustainable Energy Technology – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'H4',
    edv: '364140',
    semester: 3,
    title: l('Technische Thermodynamik', 'Technical Thermodynamics'),
    shortTitle: l('Thermodynamik', 'Thermodynamics'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'blue',
    summary: l(
      'Thermodynamische Systeme, Zustandsgrößen, Kreisprozesse, Wärmeübertragung und Strömungsmechanik.',
      'Thermodynamic systems, state variables, cycles, heat transfer and fluid dynamics.',
    ),
    components: [
      comp('thermodynamics', '364141', 'Thermodynamik', 'Thermodynamics', 2, 2.5, [
        ['Thermische Größen und Systeme', 'Thermal quantities and systems'],
        ['Zustandsgleichungen', 'Equations of state'],
        ['Hauptsätze der Thermodynamik', 'Laws of thermodynamics'],
        ['Kreisprozesse', 'Thermodynamic cycles'],
      ]),
      comp('heat-transfer', '364142', 'Wärmeübertragung und Strömungslehre', 'Heat Transfer and Fluid Dynamics', 2, 2.5, [
        ['Wärmeleitung', 'Heat conduction'],
        ['Konvektion', 'Convection'],
        ['Wärmestrahlung', 'Thermal radiation'],
        ['Strömungsmechanik', 'Fluid mechanics'],
      ]),
    ],
    examParts: [
      ex(
        'h4-exam',
        'thermodynamics',
        'Technische Thermodynamik – Portfolioprüfung',
        'Technical Thermodynamics – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'H5',
    edv: '364150',
    semester: 3,
    title: l('Energiesysteme und Smart Grids', 'Energy Systems and Smart Grids'),
    shortTitle: l('Energiesysteme & Grids', 'Energy Systems & Grids'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'sage',
    summary: l(
      'Fossile Großkraftwerke, Kernkraft, Kraft-Wärme-Kopplung, zentrale und dezentrale Energiesysteme sowie Smart Grids.',
      'Large fossil power plants, nuclear power, CHP, centralised and decentralised energy systems and smart grids.',
    ),
    components: [
      comp('central-energy', '364151', 'Zentrale Energiesysteme', 'Central Energy Systems', 2, 2.5, [
        ['Verbrennungsrechnung', 'Combustion calculations'],
        ['Fossile Großkraftwerke', 'Large fossil power plants'],
        ['Strömungsmaschinen', 'Turbomachinery'],
        ['Kernkraftwerke', 'Nuclear power plants'],
        ['Kraft-Wärme-Kopplung', 'Combined heat and power'],
      ]),
      comp('decent-grids', '364152', 'Dezentrale Energiesysteme und Smart Grids', 'Decentralized Energy Systems and Smart Grids', 2, 2.5, [
        ['Dezentrale Erzeugung', 'Decentralised generation'],
        ['Netzintegration', 'Grid integration'],
        ['Smart-Grid-Konzepte', 'Smart grid concepts'],
        ['Betrieb und Regelung', 'Operation and control'],
      ]),
    ],
    examParts: [
      ex('h5-exam-1', 'central-energy', 'Zentrale Energiesysteme – Klausur', 'Central Energy Systems exam', 'written', 60, 2),
      ex('h5-exam-2', 'decent-grids', 'Dezentrale Systeme & Smart Grids – Klausur', 'Decentralized Systems & Smart Grids exam', 'written', 60, 3),
    ],
  },
  {
    id: 'H6',
    edv: '364160',
    semester: 3,
    title: l('Labor Dezentrale Energiesysteme und Smart Grids', 'Decentralized Energy Systems and Smart Grid Laboratory'),
    shortTitle: l('Labor Dezentrale Systeme', 'Decentralized Systems Lab'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'teal',
    summary: l(
      'Labor zu PV, Batterien, Brennstoffzellen, Windenergie und dezentraler Versorgung – messen, auslegen, bewerten.',
      'Lab on PV, batteries, fuel cells, wind energy and decentralised supply – measure, design, evaluate.',
    ),
    components: [
      comp('decent-lab', '364161', 'Labor Dezentrale Energiesysteme', 'Decentralized Energy Systems Lab', 4, 5, [
        ['PV-Anlagen unter Betriebsbedingungen', 'PV systems under operating conditions'],
        ['Lade- und Entladekennlinien von Akkumulatoren', 'Battery charge and discharge curves'],
        ['Brennstoffzellen', 'Fuel cells'],
        ['Windenergie mit DFIG', 'Wind energy with DFIG'],
        ['Auslegung dezentraler Versorgung', 'Design of decentralised supply'],
      ]),
    ],
    examParts: [
      ex('h6-lab', 'decent-lab', 'Labor – Leistungsnachweis', 'Laboratory – course achievement', 'lab', undefined, undefined, false),
    ],
  },

  {
    id: 'H7',
    edv: '364170',
    semester: 4,
    title: l('Regelungstechnik', 'Control Engineering'),
    shortTitle: l('Regelungstechnik', 'Control Engineering'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'blue',
    summary: l(
      'Systemtheorie, Laplace-Transformation, Übertragungsfunktionen, Stabilität, Wurzelortskurve, Bode-Diagramm und Reglerentwurf.',
      'System theory, Laplace transform, transfer functions, stability, root locus, Bode plots and controller design.',
    ),
    components: [
      comp('control', '364171', 'Regelungstechnik', 'Control Engineering', 4, 5, [
        ['Einführung in die Systemtheorie', 'Introduction to system theory'],
        ['Regelkreis und Struktur', 'Control loop and structure'],
        ['Laplace-Transformation', 'Laplace transform'],
        ['Übertragungsfunktion und Systemverhalten', 'Transfer function and system response'],
        ['Stabilität und Wurzelortskurve', 'Stability and root locus'],
        ['Frequenzanalyse und Bode-Plot', 'Frequency analysis and Bode plot'],
        ['Reglerentwurf', 'Controller design'],
      ]),
    ],
    examParts: [ex('h7-exam', 'control', 'Regelungstechnik – Klausur', 'Control Engineering exam', 'written', 120)],
  },
  {
    id: 'H8',
    edv: '364180',
    semester: 4,
    title: l('Labor Regelungs- und Automatisierungstechnik', 'Control and Automation Laboratory'),
    shortTitle: l('Labor Regelungstechnik', 'Control Lab'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'violet',
    summary: l(
      'MATLAB/Simulink, Regelkreis-Simulation, PID-Dimensionierung, SPS-Programmierung mit CODESYS und Raspberry Pi.',
      'MATLAB/Simulink, control loop simulation, PID tuning, PLC programming with CODESYS and Raspberry Pi.',
    ),
    components: [
      comp('control-lab', '364181', 'Labor Regelungs- und Automatisierungstechnik', 'Control and Automation Laboratory', 4, 5, [
        ['MATLAB und Simulink', 'MATLAB and Simulink'],
        ['Simulation von Regelkreisen', 'Control loop simulation'],
        ['PID-Dimensionierung', 'PID tuning'],
        ['SPS-Programmierung mit CODESYS', 'PLC programming with CODESYS'],
        ['Visualisierung und Raspberry Pi', 'Visualisation and Raspberry Pi'],
      ]),
    ],
    examParts: [
      ex('h8-lab', 'control-lab', 'Labor – Leistungsnachweis', 'Laboratory – course achievement', 'lab', undefined, undefined, false),
    ],
  },
  {
    id: 'H9',
    edv: '364190',
    semester: 4,
    title: l('Betriebswirtschaftslehre 1', 'Business Administration 1'),
    shortTitle: l('BWL 1', 'Business Admin 1'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'amber',
    summary: l(
      'Wirtschaftssysteme, Unternehmensformen, Managementfunktionen, Marketing, Finanzen und Grundlagen des Rechnungswesens.',
      'Economic systems, company forms, management functions, marketing, finance and accounting fundamentals.',
    ),
    components: [
      comp('business1', '364191', 'Einführung in die Betriebswirtschaftslehre', 'Introduction to Business Administration', 4, 5, [
        ['Wirtschaftssysteme und Unternehmen', 'Economic systems and companies'],
        ['Wettbewerb und globale Märkte', 'Competition and global markets'],
        ['Managementfunktionen', 'Management functions'],
        ['Marketing und Vertrieb', 'Marketing and sales'],
        ['Finanzen und Investition', 'Finance and investment'],
      ]),
    ],
    examParts: [ex('h9-exam', 'business1', 'BWL 1 – Klausur', 'Business Administration 1 exam', 'written', 90)],
  },
  {
    id: 'H10',
    edv: '364200',
    semester: 4,
    title: l('Betriebswirtschaftslehre 2', 'Business Administration 2'),
    shortTitle: l('BWL 2', 'Business Admin 2'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'amber',
    summary: l(
      'Rechnungswesen und Projektmanagement: Buchführung, Bilanz, Kostenrechnung, Projektphasen, Planung und Steuerung.',
      'Accounting and project management: bookkeeping, balance sheet, cost accounting, project phases, planning and control.',
    ),
    components: [
      comp('accounting', '364201', 'Einführung in das Rechnungswesen', 'Introduction to Accounting', 2, 3, [
        ['Finanzbuchhaltung', 'Financial accounting'],
        ['Inventur, Inventar und Bilanz', 'Inventory and balance sheet'],
        ['Buchungssätze und Konten', 'Journal entries and ledgers'],
        ['Grundsätze ordnungsmäßiger Buchführung', 'Accounting principles'],
      ]),
      comp('project-management', '364202', 'Projektmanagement', 'Project Management', 2, 2, [
        ['Problemlösungsprozess', 'Problem-solving process'],
        ['Projektphasen und Meilensteine', 'Project phases and milestones'],
        ['Planung und Steuerung', 'Planning and control'],
        ['Risiken und Kommunikation', 'Risks and communication'],
      ]),
    ],
    examParts: [
      ex('h10-exam-1', 'accounting', 'Rechnungswesen – Klausur', 'Accounting exam', 'written', 90, 3),
      ex('h10-exam-2', 'project-management', 'Projektmanagement – Klausur', 'Project Management exam', 'written', 60, 2),
    ],
  },
  {
    id: 'H11',
    edv: '364210',
    semester: 4,
    title: l('Heizung, Lüftung und Klimatechnik (HLK)', 'Heating, Ventilation and Air Conditioning (HVAC)'),
    shortTitle: l('HLK-Technik', 'HVAC'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'rose',
    summary: l(
      'Klimatechnik sowie Heizungs- und Kältetechnik: Lasten, Anlagen, Komponenten und Energieverbrauch.',
      'Air conditioning plus heating and refrigeration: loads, systems, components and energy demand.',
    ),
    components: [
      comp('air-conditioning', '364211', 'Klimatechnik', 'Air Conditioning Technology', 2, 2.5, [
        ['Einführung und Behaglichkeit', 'Introduction and comfort'],
        ['Physiologie und Raumklima', 'Physiology and indoor climate'],
        ['Lüftung und Klimaanlagen', 'Ventilation and air conditioning'],
        ['Komponenten und Regelung', 'Components and control'],
      ]),
      comp('heating-refrigeration', '364212', 'Heizungs- und Kältetechnik', 'Heating and Refrigeration Technology', 2, 2.5, [
        ['Heizlast und Energieverbrauch', 'Heating load and energy demand'],
        ['Heizsysteme', 'Heating systems'],
        ['Kältetechnik und Wärmepumpen', 'Refrigeration and heat pumps'],
        ['Hydraulik und Verteilung', 'Hydraulics and distribution'],
      ]),
    ],
    examParts: [
      ex(
        'h11-exam',
        'air-conditioning',
        'HLK – Portfolioprüfung',
        'HVAC – portfolio exam',
        'portfolio',
        120,
      ),
    ],
  },
  {
    id: 'H12',
    edv: '364220',
    semester: 4,
    title: l('Labor Heizung, Lüftung und Klimatechnik', 'Heating, Ventilation and Air Conditioning Laboratory'),
    shortTitle: l('Labor HLK', 'HVAC Lab'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'rose',
    summary: l(
      'Labor zu Kraft-Wärme-Kopplung, Heizungs-, Klima- und Kältetechnik.',
      'Lab on combined heat and power, heating, air conditioning and refrigeration.',
    ),
    components: [
      comp('hvac-lab', '364221', 'Labor HLK', 'HVAC Laboratory', 4, 5, [
        ['Kraft-Wärme-Kopplung', 'Combined heat and power'],
        ['Heizungstechnik', 'Heating technology'],
        ['Klimatechnik', 'Air conditioning'],
        ['Kältetechnik', 'Refrigeration'],
        ['Messung und Auswertung', 'Measurement and evaluation'],
      ]),
    ],
    examParts: [
      ex('h12-lab', 'hvac-lab', 'Labor – Leistungsnachweis', 'Laboratory – course achievement', 'lab', undefined, undefined, false),
    ],
  },

  {
    id: 'P',
    edv: '364350',
    semester: 5,
    title: l('Praxissemester und Kolloquium', 'Internship and Colloquium'),
    shortTitle: l('Praxissemester', 'Internship'),
    ects: 30,
    sws: 4,
    kind: 'internship',
    accent: 'sage',
    summary: l(
      'Praxissemester mit betrieblicher Tätigkeit, Kolloquium und Reflexion der Unternehmenspraxis.',
      'Practical semester with an industry placement, colloquium and reflection on corporate practice.',
    ),
    components: [
      comp('internship', '364351', 'Praxissemester und Kolloquium', 'Internship and Colloquium', 2, 28, [
        ['Praktische Tätigkeit im Unternehmen', 'Practical work in a company'],
        ['Projektaufgabe und Dokumentation', 'Project task and documentation'],
        ['Kolloquium und Präsentation', 'Colloquium and presentation'],
      ]),
      comp('corporate-life', '364352', 'Corporate Life', 'Corporate Life', 2, 2, [
        ['Kommunikationstraining', 'Communication training'],
        ['Präsentation und Auftreten', 'Presentation and presence'],
        ['Teamarbeit und Reflexion', 'Teamwork and reflection'],
      ]),
    ],
    examParts: [
      ex('p-internship', 'internship', 'Praxissemester – Bericht und Kolloquium', 'Internship – report and colloquium', 'report'),
      ex('p-corporate', 'corporate-life', 'Corporate Life – Referat', 'Corporate Life – presentation', 'report'),
    ],
  },

  {
    id: 'H13',
    edv: '364230',
    semester: 6,
    title: l('Nachhaltigkeit', 'Sustainability'),
    shortTitle: l('Nachhaltigkeit', 'Sustainability'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'teal',
    summary: l(
      'Umweltökonomie, Umweltmanagement, Ethik, Nachhaltigkeit und Lebenszyklusanalyse (z. B. SimaPro).',
      'Environmental economics, environmental management, ethics, sustainability and life cycle assessment (e.g. SimaPro).',
    ),
    components: [
      comp('sustainability', '364231', 'Umweltökonomie, Management und Ethik', 'Environmental Economics, Management and Ethics', 4, 5, [
        ['Nachhaltigkeit und Ethik', 'Sustainability and ethics'],
        ['Umweltökonomie', 'Environmental economics'],
        ['Umweltmanagement', 'Environmental management'],
        ['Lebenszyklusanalyse', 'Life cycle assessment'],
        ['SimaPro und Projektarbeit', 'SimaPro and project work'],
      ]),
    ],
    examParts: [ex('h13-exam', 'sustainability', 'Nachhaltigkeit – Klausur', 'Sustainability exam', 'written', 90)],
  },
  {
    id: 'H14',
    edv: '364240',
    semester: 6,
    title: l('Modellierung und Simulation von Energiesystemen', 'Modeling and Simulation of Energy Systems'),
    shortTitle: l('Modellierung & Simulation', 'Modeling & Simulation'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'blue',
    summary: l(
      'Modellbildung, numerische Verfahren, Kurvenanpassung und Simulation von PV, Wind, BHKW, Speichern und dezentralen Systemen.',
      'Model building, numerical methods, curve fitting and simulation of PV, wind, CHP, storage and decentralised systems.',
    ),
    components: [
      comp('modeling', '364241', 'Modellierung und Simulation', 'Modelling and Simulation', 2, 5, [
        ['Einführung in Modellbildung', 'Introduction to modelling'],
        ['Numerische Gleichungslöser', 'Numerical equation solvers'],
        ['Runge-Kutta und Optimierung', 'Runge-Kutta and optimisation'],
        ['Kurvenanpassung und Interpolation', 'Curve fitting and interpolation'],
        ['Komponenten- und Systemmodelle', 'Component and system models'],
      ]),
      comp('modeling-lab', '364242', 'Simulationslabor', 'Modelling and Simulation Laboratory', 2, 0, [
        ['Modellierung mit Software', 'Modelling with software'],
        ['Simulation mit realen Daten', 'Simulation with real data'],
        ['Ergebnisanalyse', 'Result analysis'],
      ]),
    ],
    examParts: [
      ex('h14-exam', 'modeling', 'Modellierung und Simulation – Klausur', 'Modelling and Simulation exam', 'written', 90),
      ex('h14-lab', 'modeling-lab', 'Simulationslabor – Leistungsnachweis', 'Simulation Lab – course achievement', 'lab', undefined, undefined, false),
    ],
  },
  {
    id: 'H15',
    edv: '364250',
    semester: 6,
    title: l('Elektroenergiesysteme', 'Electric Power Systems'),
    shortTitle: l('Elektroenergiesysteme', 'Electric Power Systems'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'amber',
    summary: l(
      'Entwicklung von Elektroenergiesystemen, Verbundnetze, Lastfluss, Netzschutz und Betriebsführung.',
      'Evolution of electric power systems, interconnected grids, load flow, protection and operation.',
    ),
    components: [
      comp('power-systems', '364251', 'Elektroenergiesysteme', 'Electric Power Systems', 4, 5, [
        ['Entwicklung der Elektroenergiesysteme', 'Evolution of power systems'],
        ['Verbundsysteme', 'Interconnected systems'],
        ['Lastfluss und Netzberechnung', 'Load flow and network calculation'],
        ['Netzschutz und Betriebsführung', 'Protection and operation'],
      ]),
    ],
    examParts: [ex('h15-exam', 'power-systems', 'Elektroenergiesysteme – Klausur', 'Electric Power Systems exam', 'written', 120)],
  },
  {
    id: 'H16',
    edv: '364260',
    semester: 6,
    title: l('Betriebswirtschaftslehre 3', 'Business Administration 3'),
    shortTitle: l('BWL 3', 'Business Admin 3'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'violet',
    summary: l(
      'International Accounting Standards, Bilanzanalyse und Start-up-Management.',
      'International accounting standards, financial statement analysis and start-up management.',
    ),
    components: [
      comp('accounting-standards', '364261', 'Internationale Rechnungslegung', 'International Accounting Standards', 2, 3, [
        ['Konzeptioneller Rahmen', 'Conceptual framework'],
        ['Bilanzierung und Bewertung', 'Recognition and measurement'],
        ['Bilanzanalyse', 'Financial statement analysis'],
        ['Globale Finanzmärkte', 'Global financial markets'],
      ]),
      comp('start-up', '364262', 'Start-up-Management', 'Start-up Management', 2, 2, [
        ['Entrepreneurship', 'Entrepreneurship'],
        ['Geschäftsmodell', 'Business model'],
        ['Businessplan', 'Business plan'],
        ['Finanzierung und Verhandlung', 'Financing and negotiation'],
      ]),
    ],
    examParts: [
      ex('h16-exam-1', 'accounting-standards', 'Internationale Rechnungslegung – Klausur', 'International Accounting exam', 'written', 60, 3),
      ex('h16-exam-2', 'start-up', 'Start-up-Management – Klausur', 'Start-up Management exam', 'written', 60, 2),
    ],
  },
  {
    id: 'H17',
    edv: '364270',
    semester: 6,
    title: l('Vertiefung / Wahlpflichtfächer', 'Specialisation / Elective Courses'),
    shortTitle: l('Wahlpflichtfächer', 'Electives'),
    ects: 10,
    sws: 8,
    kind: 'elective',
    accent: 'lime',
    summary: l(
      '10 ECTS aus dem wechselnden Wahlpflichtkatalog – Wirtschaft und Technik kombinierbar. Das Angebot wird zu Beginn des Wintersemesters bekannt gegeben.',
      '10 ECTS from the changing elective catalogue – business and technology can be combined. Courses are announced at the start of the winter semester.',
    ),
    components: [
      comp('electives', '364271', 'Wahlpflichtmodule', 'Elective Courses', 8, 10, [
        ['Wahlpflichtmodul 1', 'Elective 1'],
        ['Wahlpflichtmodul 2', 'Elective 2'],
        ['Wahlpflichtmodul 3', 'Elective 3'],
        ['Wahlpflichtmodul 4', 'Elective 4'],
      ]),
    ],
    examParts: [
      ex(
        'h17-exam',
        'electives',
        'Wahlpflichtprüfungen (2–4 Leistungen)',
        'Elective assessments (2–4 examinations)',
        'elective',
      ),
    ],
  },

  {
    id: 'H18',
    edv: '364280',
    semester: 7,
    title: l('Interdisziplinäres Projektlabor', 'Interdisciplinary Project Laboratory'),
    shortTitle: l('Projektlabor', 'Project Lab'),
    ects: 10,
    sws: 8,
    kind: 'main',
    accent: 'violet',
    summary: l(
      'Interdisziplinäres Projektlabor mit praktischer Aufgabe aus Technik und Wirtschaft.',
      'Interdisciplinary project lab with a practical task from engineering and business.',
    ),
    components: [
      comp('project-lab', '364281', 'Projektlabor', 'Project Lab', 8, 10, [
        ['Projektdefinition und Anforderungen', 'Project definition and requirements'],
        ['Technische Umsetzung', 'Technical implementation'],
        ['Wirtschaftliche Bewertung', 'Economic evaluation'],
        ['Dokumentation und Präsentation', 'Documentation and presentation'],
      ]),
    ],
    examParts: [
      ex('h18-project', 'project-lab', 'Projektlabor – Projektarbeit', 'Project Lab – project work', 'project'),
    ],
  },
  {
    id: 'H19',
    edv: '364290',
    semester: 7,
    title: l('Spezielle Themen des Energiemanagements', 'Special Topics of Energy Management'),
    shortTitle: l('Energiemanagement', 'Energy Management'),
    ects: 5,
    sws: 4,
    kind: 'main',
    accent: 'amber',
    summary: l(
      'Energiewende, Speichertechnologien, Energie-Mix, Leistungselektronik, Netzintegration und Auslegung von Hybridsystemen.',
      'Energy transition, storage technologies, energy mix, power electronics, grid integration and hybrid system design.',
    ),
    components: [
      comp('energy-topics-1', '364291', 'Spezielle Themen 1', 'Special Topics 1', 2, 2, [
        ['Entwicklung der Stromversorgung', 'Evolution of electricity supply'],
        ['Elektrochemische Speicher', 'Electrochemical storage'],
        ['Energie-Mix-Strukturen', 'Energy mix structures'],
      ]),
      comp('energy-topics-2', '364292', 'Spezielle Themen 2', 'Special Topics 2', 2, 3, [
        ['Leistungselektronik', 'Power electronics'],
        ['Modulare AC-Kopplung', 'Modular AC coupling'],
        ['Energiemanagementstrategien', 'Energy management strategies'],
        ['Dimensionierung autarker Systeme', 'Sizing of autonomous systems'],
      ]),
    ],
    examParts: [
      ex('h19-exam-1', 'energy-topics-1', 'Spezielle Themen 1 – Klausur', 'Special Topics 1 exam', 'written', 90, 2),
      ex('h19-exam-2', 'energy-topics-2', 'Spezielle Themen 2 – Klausur', 'Special Topics 2 exam', 'written', 90, 3),
    ],
  },
  {
    id: 'BT',
    edv: '364300',
    semester: 7,
    title: l('Bachelorarbeit und Kolloquium', 'Bachelor Thesis and Colloquium'),
    shortTitle: l('Bachelorarbeit', 'Bachelor Thesis'),
    ects: 15,
    sws: 0,
    kind: 'thesis',
    accent: 'lime',
    summary: l(
      'Bachelorarbeit (12 ECTS) und Kolloquium (3 ECTS) mit wissenschaftlicher Methodik und Verteidigung der Ergebnisse.',
      'Bachelor thesis (12 ECTS) and colloquium (3 ECTS) applying scientific methods and defending the results.',
    ),
    components: [
      comp('thesis', '364301', 'Bachelorarbeit', 'Bachelor Thesis', 0, 12, [
        ['Forschungsfrage und Methodik', 'Research question and methodology'],
        ['Literatur- und Quellenarbeit', 'Literature and source work'],
        ['Durchführung und Auswertung', 'Execution and evaluation'],
        ['Wissenschaftliches Schreiben', 'Academic writing'],
      ]),
      comp('colloquium', '364302', 'Bachelor-Kolloquium', 'Bachelor Colloquium', 0, 3, [
        ['Präsentation der Ergebnisse', 'Presentation of results'],
        ['Verteidigung', 'Defence'],
        ['Fachliche Diskussion', 'Expert discussion'],
      ]),
    ],
    examParts: [
      ex('bt-thesis', 'thesis', 'Bachelorarbeit', 'Bachelor thesis', 'thesis'),
      ex('bt-colloquium', 'colloquium', 'Bachelor-Kolloquium', 'Bachelor colloquium', 'report'),
    ],
  },
]

export const MODULE_BY_ID = new Map(CURRICULUM.map((module) => [module.id, module]))
export const COMPONENT_BY_ID = new Map(
  CURRICULUM.flatMap((module) =>
    module.components.map((component) => [
      component.id,
      { component, module },
    ] as const),
  ),
)

export const COMPONENTS = CURRICULUM.flatMap((module) =>
  module.components.map((component) => ({
    ...component,
    moduleId: module.id,
    semester: module.semester,
    accent: module.accent,
  })),
)

export const EXAM_DEFS = CURRICULUM.flatMap((module) =>
  module.examParts.map((part) => ({
    ...part,
    key: `${module.id}:${part.id}`,
    moduleId: module.id,
    semester: module.semester,
    accent: module.accent,
    moduleTitle: module.title,
    ects: module.ects,
  })),
)

export type ExamDef = (typeof EXAM_DEFS)[number]

export const SEMESTER_ECTS = CURRICULUM.reduce<Record<number, number>>((acc, module) => {
  acc[module.semester] = (acc[module.semester] ?? 0) + module.ects
  return acc
}, {})

export const TOTAL_ECTS = CURRICULUM.reduce((sum, module) => sum + module.ects, 0)
