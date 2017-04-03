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
INSERT INTO facilities (id, props, address) VALUES ('988e00d0-4b27-4ab4-ac00-59fcba6847d1', $${"name":"office","admins":["bowanddrape"]}$$, $${"street_address":"588 Broadway","locality":"New York","region":"NY","postal_code":"10012","country":"USA"}$$);
INSERT INTO facilities (props) VALUES ($${"name":"customer_pickup"}$$);
INSERT INTO facilities (props) VALUES ($${"name":"canceled"}$$);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID,
  to_id UUID,
  contents JSONB,
  requested INT DEFAULT date_part('epoch',NOW()),
  packed INT,
  received INT,
  store_id UUID,
  email VARCHAR(254),
  props JSONB,
  payments JSONB,
  tracking_code VARCHAR(64),
  shipping_label VARCHAR(254),
  address JSONB
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  products JSONB,
  props JSONB,
  facility_id UUID
);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254),
  store_id UUID,
  contents JSONB,
  UNIQUE (email, store_id)
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
    if (!inventory) {
      inventory = {};
    }
    var sent = plv8.execute( "SELECT assembly_extract_skus(jsonb_agg(contents)) FROM shipments WHERE from_id=$1", facility_id )[0].assembly_extract_skus;
    for (var sku in sent) {
      inventory[sku] = inventory[sku]?inventory[sku]:0;
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

