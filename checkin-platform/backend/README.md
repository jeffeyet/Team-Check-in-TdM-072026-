# backend/ — API (esqueleto)

Aún no hay código: esta estructura es un boceto y se detalla al arrancar la
fase F1 (ver `../docs/05-roadmap.md`). Stack propuesto en
`../docs/03-arquitectura.md`.

    src/
      routes/      Endpoints REST /api/v1 (auth, classes, activities, join)
      services/    Lógica de negocio (ventanas de actividad, aislamiento por clase)
      db/          Conexión, consultas y migraciones
    tests/         Pruebas del API
