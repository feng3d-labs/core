import { Matrix4x4, Plane, Vector3, Vector4 } from '@feng3d/math';
import { RenderAtomic } from '@feng3d/renderer';
import { serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { RegisterComponent } from '../component/Component';
import { GameObject } from '../core/GameObject';
import { Renderable } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { Material } from '../materials/Material';
import { AddComponentMenu } from '../Menu';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { Scene } from '../scene/Scene';
import { WaterUniforms } from './WaterMaterial';

declare global
{
    export interface MixinsComponentMap
    {
        Water: Water
    }
    export interface MixinsPrimitiveGameObject
    {
        Water: GameObject;
    }
}

/**
 * The Water component renders the terrain.
 */
@AddComponentMenu('Graphics/Water')
@RegisterComponent()
export class Water extends Renderable
{
    __class__: 'feng3d.Water';

    geometry = Geometry.getDefault('Plane');

    material = Material.getDefault('Water-Material');

    /**
     * 帧缓冲对象，用于处理水面反射
     */
    private frameBufferObject = new FrameBufferObject();

    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        const uniforms = this.material.uniforms as WaterUniforms;
        const sun = this.gameObject.scene.activeDirectionalLights[0];
        if (sun)
        {
            uniforms.u_sunColor = sun.color;
            uniforms.u_sunDirection = sun.transform.localToWorldMatrix.getAxisZ().negate();
        }

        const clipBias = 0;

        uniforms.u_time += 1.0 / 60.0;

        // this.material.uniforms.s_mirrorSampler.url = "Assets/floor_diffuse.jpg";

        super.beforeRender(renderAtomic, scene, camera);

        // eslint-disable-next-line no-constant-condition
        if (1) return;
        //
        const mirrorWorldPosition = this.transform.worldPosition;
        const cameraWorldPosition = camera.transform.worldPosition;

        let rotationMatrix = this.transform.rotationMatrix;

        const normal = rotationMatrix.getAxisZ();

        const view = mirrorWorldPosition.subTo(cameraWorldPosition);
        if (view.dot(normal) > 0) return;

        view.reflect(normal).negate();
        view.add(mirrorWorldPosition);

        rotationMatrix = camera.transform.rotationMatrix;

        const lookAtPosition = new Vector3(0, 0, -1);
        lookAtPosition.applyMatrix4x4(rotationMatrix);
        lookAtPosition.add(cameraWorldPosition);

        const target = mirrorWorldPosition.subTo(lookAtPosition);
        target.reflect(normal).negate();
        target.add(mirrorWorldPosition);

        const mirrorCamera = serialization.setValue(new GameObject(), { name: 'waterMirrorCamera' }).addComponent(Camera);
        mirrorCamera.transform.position = view;
        mirrorCamera.transform.lookAt(target, rotationMatrix.getAxisY());

        mirrorCamera.lens = camera.lens.clone();

        const textureMatrix = new Matrix4x4(
            [
                0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0
            ]
        );
        textureMatrix.append(mirrorCamera.viewProjection);

        const mirrorPlane = Plane.fromNormalAndPoint(mirrorCamera.transform.worldToLocalMatrix.transformVector3(normal), mirrorCamera.transform.worldToLocalMatrix.transformPoint3(mirrorWorldPosition));
        const clipPlane = new Vector4(mirrorPlane.a, mirrorPlane.b, mirrorPlane.c, mirrorPlane.d);

        const projectionMatrix = mirrorCamera.lens.matrix;

        const q = new Vector4();
        q.x = (clipPlane.x / Math.abs(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (clipPlane.y / Math.abs(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

        clipPlane.scale(2.0 / clipPlane.dot(q));

        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        projectionMatrix.elements[14] = clipPlane.w;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const eye = camera.transform.worldPosition;

        // 不支持直接操作gl，下面代码暂时注释掉！
        // //
        // var frameBufferObject = this.frameBufferObject;
        // FrameBufferObject.active(gl, frameBufferObject);

        // //
        // gl.viewport(0, 0, frameBufferObject.OFFSCREEN_WIDTH, frameBufferObject.OFFSCREEN_HEIGHT);
        // gl.clearColor(1.0, 1.0, 1.0, 1.0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // skyboxRenderer.draw(gl, scene, mirrorCamera);
        // // forwardRenderer.draw(gl, scene, mirrorCamera);
        // // forwardRenderer.draw(gl, scene, camera);

        // frameBufferObject.deactive(gl);

        //
        // this.material.uniforms.s_mirrorSampler = frameBufferObject.texture;

        uniforms.u_textureMatrix = textureMatrix;
    }
}

GameObject.registerPrimitive('Water', (g) =>
{
    g.addComponent(Water);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Water',
        priority: -20000,
        click: () =>
            GameObject.createPrimitive('Water')
    }
);

