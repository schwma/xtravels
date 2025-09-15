const cds = require("@sap/cds");

cds.on("connect", async (srv) => {
  const asserted = (e) => {
    if (!e.is_entity) return;
    for (const element of e.elements) {
      if (element["@assert"]) return true;
    }
  };

  srv.model.collect(asserted, (entity) => {
    srv.after(
      ["INSERT", "UPSERT", "UPDATE", "DELETE"],
      entity,
      async (results, req) => {
        for (const col in entity.elements) {
          const element = entity.elements[col];

          let assert = element["@assert"];
          if (!assert) {
            if (element["@mandatory"])
              assert = element["@assert"] = cds.parse.expr`(case when ${{
                ref: [element.name],
              }} is null then 'ASSERT_NOT_NULL' end)`;
            else continue;
          }

          const query = cds.ql.SELECT.from(
            cds.ql.SELECT([{ xpr: assert.xpr, as: "error" }]).from(entity)
          ).where([{ ref: ["error"] }, "!=", { val: null }]);

          const res = await query;

          for (const r of res) {
            const [, message, argsRaw] = /(.*?)\((.*)\)/.exec(r.error) || [
              ,
              r.error,
            ];
            const args = argsRaw?.split(",")?.map(JSON.parse);
            const target = "in/" + element.name;
            req.error({
              code: 400,
              message,
              args,
              target,
              "@Common.numericSeverity": 4,
            });
          }
        }
      }
    );
  });
});
