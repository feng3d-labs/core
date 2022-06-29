import { defaultRotationOrder, Vector4 } from '@feng3d/math';
import { lazy, LazyObject } from '@feng3d/polyfill';
import { Camera } from '../../cameras/Camera';
import { Uniforms } from '@feng3d/renderer';
import { GL } from '@feng3d/renderer';
import { Scene } from '../../scene/Scene';

/**
 * 前向渲染器
 */
export class ForwardRenderer
{
    /**
     * 渲染
     */
    draw(gl: GL, scene: Scene, camera: Camera)
    {
        const blenditems = scene.getPickCache(camera).blenditems;
        const unblenditems = scene.getPickCache(camera).unblenditems;

        const uniforms: LazyObject<Uniforms> = {} as any;
        //
        uniforms.u_projectionMatrix = camera.lens.matrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
        uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        uniforms.u_cameraPos = camera.transform.worldPosition;
        uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);
        uniforms.u_sceneAmbientColor = scene.ambientColor;

        const ctime = (Date.now() / 1000) % 3600;
        uniforms._Time = new Vector4(ctime / 20, ctime, ctime * 2, ctime * 3);

        unblenditems.concat(blenditems).forEach((renderable) =>
        {
            // 绘制
            const renderAtomic = renderable.renderAtomic;

            for (const key in uniforms)
            {
                renderAtomic.uniforms[key] = uniforms[key];
            }
            //
            renderAtomic.uniforms.u_mvMatrix = () =>
                lazy.getvalue(renderAtomic.uniforms.u_modelMatrix).clone().append(lazy.getvalue(renderAtomic.uniforms.u_viewMatrix));
            renderAtomic.uniforms.u_ITMVMatrix = () =>
                lazy.getvalue(renderAtomic.uniforms.u_mvMatrix).clone().invert().transpose();

            renderAtomic.shaderMacro.RotationOrder = defaultRotationOrder;

            renderable.beforeRender(renderAtomic, scene, camera);

            gl.render(renderAtomic);
        });
    }
}

/**
 * 前向渲染器
 */
export const forwardRenderer = new ForwardRenderer();
