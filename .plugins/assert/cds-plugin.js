const cds = require("@sap/cds");
const { target } = require("@sap/cds/lib/ql/cds.ql-infer");

cds.on("connect", async (srv) => {
  const asserted = (e) => {
    if (!e.is_entity) return;
    for (const element of e.elements) {
      if (element["@assert"]) return true;
    }
  };

  const todos = srv.model.collect(asserted, (entity) => {
    srv.after(["INSERT", "UPSERT", "UPDATE", "DELETE"], entity, async (results, req) => {
      for (const col in entity.elements) {
        const element = entity.elements[col];

        const assert = element["@assert"];
        if (!assert) continue;

        const query = cds.ql.SELECT.from(
          cds.ql.SELECT([{ xpr: assert.xpr, as: "error" }]).from(entity)
        ).where([{ ref: ["error"] }, "!=", { val: null }]);

        const res = await query;

        for (const r of res) {
          const message = r.error;
          const target = element.name;
          req.error({
            code: 400,
            message,
            target
            // target: targetList[0]?.ref.join("/"),
            // "@Common.additionalTargets": targetList.map((t) => t.ref.join("/")),
          });
        }

        debugger;
      }
    });
  });
});

//
// Temporary monkey patches till upcoming cds release
//

cds.extend(cds.entity).with(
  class {
    get service() {
      return this._service;
    }
    get source() {
      return this.query && this.__proto__;
    }
  }
);
