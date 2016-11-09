INSERT INTO facilities (id, props, address) VALUES ('988e00d0-4b27-4ab4-ac00-59fcba6847d1', $${"name":"office","admins":["bowanddrape"]}$$, $${"street_address":"588 Broadway","locality":"New York","region":"NY","postal_code":"10012","country":"USA"}$$);
INSERT INTO components (sku, dims, image_url) VALUES ('test_sku0', $${"price":50.99,"weight":0.1}$$, 'https://upload.wikimedia.org/wikipedia/en/f/ff/SuccessKid.jpg');
INSERT INTO shipments (from_id, to_id, contents) VALUES (null,'988e00d0-4b27-4ab4-ac00-59fcba6847d1',$$[{"sku":"test_sku0","assembly":{"sku":"test_sku1"}},{"sku":"test_sku0","quantity":1}]$$);

INSERT INTO pages (path, elements) VALUES ($$/customize-your-own$$, $$[{"type":"ProductList","props":{"store":{"model":"Store","query":{"id":"78f87a89-1bcb-4048-b6e5-68cf4ffcc53a"}}}}]$$);


INSERT INTO pages (path, elements) VALUES ($$/buildlistLegacy$$, $$[{"type":"ItemProductionChecklistLegacy","props":{}}]$$);

INSERT INTO shipments (from_id, to_id, contents) VALUES (null,'988e00d0-4b27-4ab4-ac00-59fcba6847d1',$$[{"sku":"test_sku3"},{"sku":"test_sku5","quantity":1}]$$);
INSERT INTO shipments (from_id, to_id, contents) VALUES ('988e00d0-4b27-4ab4-ac00-59fcba6847d1',null,$$[{"sku":"test_sku3"},{"sku":"test_sku5"}]$$);


INSERT INTO components (sku, props) VALUES ('oshoodie_lg_m', $${"image":"https://www.bowanddrape.com/renders/272/272_27535_front2016-11-06.jpg","price":78}$$);

INSERT INTO shipments (from_id, to_id, contents, received) VALUES (null,'988e00d0-4b27-4ab4-ac00-59fcba6847d1',$$[{"sku":"oshoodie_lg_m","quantity":20,"weight":0.2}]$$, date_part('epoch',NOW()));


INSERT INTO stores (id, facility_id, products) VALUES ($$78f87a89-1bcb-4048-b6e5-68cf4ffcc53a$$, $$988e00d0-4b27-4ab4-ac00-59fcba6847d1$$, $$[{"sku":"oshoodie","props":{"name":"Oversized Hoodie","image":"https://d1or2mn52ns8hd.cloudfront.net/originals/2016/11/Hoodie_DYO-Products41.jpg_canvas_430_430.png"},"options":{"maroon":{"props":{"image":"https://www.bowanddrape.com/renders/272/272_27538_front2016-11-06.jpg_canvas_540_360.jpg"},"options":{"medium":{"sku":"oshoodie_mar_m"}}}, "light grey":{"props":{"image":"https://www.bowanddrape.com/renders/272/272_27535_front2016-11-06.jpg_canvas_540_360.jpg"},"options":{"small":{"sku":"oshoodie_lg_s"},"medium":{"sku":"oshoodie_lg_m"}}}, "black":{"props":{"name":"Black Oversized Hoodie","image":"https://www.bowanddrape.com/renders/272/272_27536_front2016-11-06.jpg_canvas_540_360.jpg"},"options":{"small":{"sku":"oshoodie_b_s"},"medium":{"sku":"oshoodie_b_m"}}}}}]$$);
