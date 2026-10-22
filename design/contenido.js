/* Rally Design — contenido de referencia (datos, no estilo).
   Los estilos viven en presets.js; aquí solo el texto y los recursos que la
   lámina muestra. Estos valores son marcadores editables: el equipo escribe
   los suyos y el editor los guarda en localStorage.

   Si el proyecto tiene brief.json, el editor lo lee al arrancar y usa
   project_name / team_name / university / city como base.

   Campos:
     name      nombre del grupo
     tag       hashtag del equipo
     kicker    etiqueta superior de la portada
     title     titular de portada
     pais      cifra de país en los datos (01)
     reto      cifra de reto en los datos (01)
     paisNombre nombre del país (se muestra junto al croquis)
     evento    nombre del evento / rally
     foot      línea de pie libre
     university / city  institution y ciudad
     logo      logotipo del equipo
     logoUni   logotipo de la universidad
     logoEvento logotipo del evento
     hero      imagen de portada (dataURL) */

var RALLY_CONTENIDO = {
  team: {
    name: 'Nombre del grupo',
    tag: '#GRUPO',
    kicker: 'Rally Latinoamericano de Innovación',
    title: 'Título de portada: una frase que resuma el reto',
    pais: '01',
    reto: '01',
    paisNombre: 'Nicaragua',
    evento: 'Nombre del evento',
    foot: 'Pie del carrusel',
    university: 'Universidad Nacional de Ingeniería',
    city: '',
    logo: '',
    // Monograma de la UNI por defecto (ya vive en design/assets/).
    // Si el equipo quita el logo desde el carrusel, queda vacio y no vuelve.
    logoUni: 'assets/logo_uni_symbol.png',
    logoEvento: '',
    hero: ''
  },
  mem: [
    { n: 'Nombre', s: 'Apellido', c: 'Carrera', r: 'Líder y coordinador', e: 'Ampliar mis habilidades, resolver el reto y llevarme toda la experiencia de la competencia.', photo: '', ac: '', bg: '' },
    { n: 'Nombre', s: 'Apellido', c: 'Carrera', r: 'Redactor e investigador', e: 'Ampliar mis habilidades, resolver el reto y llevarme toda la experiencia de la competencia.', photo: '', ac: '', bg: '' },
    { n: 'Nombre', s: 'Apellido', c: 'Carrera', r: 'Diseñador y planificador', e: 'Ampliar mis habilidades, resolver el reto y llevarme toda la experiencia de la competencia.', photo: '', ac: '', bg: '' },
    { n: 'Nombre', s: 'Apellido', c: 'Carrera', r: 'Editor audiovisual', e: 'Ampliar mis habilidades, resolver el reto y llevarme toda la experiencia de la competencia.', photo: '', ac: '', bg: '' },
    { n: 'Nombre', s: 'Apellido', c: 'Carrera', r: 'Especialista financiero', e: 'Ampliar mis habilidades, resolver el reto y llevarme toda la experiencia de la competencia.', photo: '', ac: '', bg: '' }
  ]
};
