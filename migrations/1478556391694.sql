CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(254) PRIMARY KEY,
  passhash VARCHAR(64),
  props JSONB,
  verified BOOLEAN DEFAULT False,
  created INT DEFAULT date_part('epoch',NOW())
);

/* needed by gen_random_uuid() */
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS components (
  sku VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid(),
  props JSONB DEFAULT '{}',
  assembly JSONB DEFAULT NULL,
  compatible_components JSONB DEFAULT NULL,
  options JSONB DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  props JSONB DEFAULT '{}',
  address JSONB
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID,
  to_id UUID,
  order_id UUID,
  contents JSONB,
  requested INT DEFAULT date_part('epoch',NOW()),
  packed INT,
  received INT,
  tracking_code VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placed INT DEFAULT date_part('epoch',NOW()),
  store_id UUID,
  email VARCHAR(254) NOT NULL,
  contents JSONB,
  props JSONB,
  payments JSONB
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID,
  products JSONB
);

CREATE TABLE IF NOT EXISTS pages (
  path VARCHAR(64) PRIMARY KEY,
  elements JSONB
);

/* v8 javascript in our psql */
CREATE EXTENSION IF NOT EXISTS plv8;

/* given a jsonb, count the skus */
CREATE OR REPLACE FUNCTION assembly_extract_skus(assembly JSONB)
RETURNS JSONB AS $$
  function _assembly_extract_skus(assembly, accumulator) {
    /* bail if nothing */
    if (!assembly) {
      return {};
    }
    /* if array, iterate over it */
    if (assembly["0"]) {
      for (var i=0; i<assembly.length; i++) {
        accumulator = _assembly_extract_skus(assembly[i],accumulator);
      }
      return accumulator;
    }
    /* add our sku to the accumulator */
    if (assembly.sku) {
      accumulator[assembly.sku] = accumulator[assembly.sku] ?
        accumulator[assembly.sku]+(typeof(assembly.quantity)!='undefined'?assembly.quantity:1) :
        assembly.quantity?assembly.quantity:1;
    }
    /* if this has an assembly in turn, recurse */
    if (assembly.assembly) {
      return _assembly_extract_skus(assembly.assembly, accumulator);
    }
    return accumulator;
  }
  return _assembly_extract_skus(assembly,{});
$$ LANGUAGE plv8 IMMUTABLE STRICT;

/* function used to get inventory view */
CREATE OR REPLACE FUNCTION build_inventory_view()
RETURNS TABLE(facility_id UUID, inventory JSONB) AS $$
  var facilities = plv8.execute("SELECT id FROM facilities");
  var ret = [];
  for (var i=0; i<facilities.length; i++) {
    /* for each facility, get the inventory count by adding the inbound
       shipments and subtracting the outgoing shipments */
    var facility_id = facilities[i].id;
    var inventory = plv8.execute( "SELECT assembly_extract_skus(jsonb_agg(contents)) FROM shipments WHERE to_id=$1 AND received<date_part('epoch',NOW())", facility_id )[0].assembly_extract_skus;
    var sent = plv8.execute( "SELECT assembly_extract_skus(jsonb_agg(contents)) FROM shipments WHERE from_id=$1", facility_id )[0].assembly_extract_skus;
    for (var sku in sent) {
      inventory[sku] -= sent[sku];
    }
    ret.push({facility_id:facility_id, inventory:inventory});
  }
  return ret;
$$ LANGUAGE plv8 IMMUTABLE STRICT;

/* this should be a materialized view once the plv8 bug gets fixed */
/* CREATE MATERIALIZED VIEW inventory AS SELECT * FROM build_inventory_view();
*/
CREATE OR REPLACE VIEW inventory AS SELECT * FROM build_inventory_view();

