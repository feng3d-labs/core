// import { ok, strictEqual } from 'assert';
// import { Entity, HideFlags, Node3D } from "@feng3d/core";
// import { gPartial } from "@feng3d/polyfill";
// import { RenderMode } from "@feng3d/renderer";
// import { serialization } from "@feng3d/serialization";

// describe('@feng3d/event', () =>
// {
//     it('可针对任意对象派发事件', () =>
//     {

//         const data: gPartial<Entity> = {
//             name: "points", hideFlags: HideFlags.Hide,
//             components: [{
//                 __class__: "feng3d.Node3D", mouseEnabled: false
//             }, {
//                 __class__: "feng3d.MeshRenderer",
//                 geometry: {
//                     __class__: "feng3d.PointGeometry",
//                     points: [
//                         { position: { __class__: "feng3d.Vector3", x: 1 }, color: { __class__: "feng3d.Color4", r: 1 } },
//                         { position: { __class__: "feng3d.Vector3", x: -1 }, color: { __class__: "feng3d.Color4", r: 1 } },
//                         { position: { __class__: "feng3d.Vector3", y: 1 }, color: { __class__: "feng3d.Color4", g: 1 } },
//                         { position: { __class__: "feng3d.Vector3", y: -1 }, color: { __class__: "feng3d.Color4", g: 1 } },
//                         { position: { __class__: "feng3d.Vector3", z: 1 }, color: { __class__: "feng3d.Color4", b: 1 } },
//                         { position: { __class__: "feng3d.Vector3", z: -1 }, color: { __class__: "feng3d.Color4", b: 1 } }],
//                 },
//                 material: {
//                     __class__: "feng3d.Material", shaderName: "point", uniforms: { u_PointSize: 5 }, renderParams: { renderMode: RenderMode.POINTS, enableBlend: true, },
//                 },
//             }],
//         };

//         var lightpoints = serialization.setValue(new Entity(), data).getComponent(Node3D);

//         ok(!!lightpoints);
//     });
// });
