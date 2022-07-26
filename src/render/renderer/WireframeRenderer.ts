import { Color4 } from '@feng3d/math';
import { lazy } from '@feng3d/polyfill';
import { Index, RenderAtomic, RenderMode, Shader, WebGLRenderer } from '@feng3d/renderer';
import { Camera } from '../../cameras/Camera';
import { WireframeComponent } from '../../component/WireframeComponent';
import { Renderable } from '../../core/Renderable';
import { Scene } from '../../scene/Scene';

declare global
{
    export interface MixinsRenderAtomic
    {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;

        wireframeShader: Shader;
    }
}

export class WireframeRenderer
{
    private renderAtomic: RenderAtomic;

    init()
    {
        if (!this.renderAtomic)
        {
            this.renderAtomic = new RenderAtomic();
            const renderParams = this.renderAtomic.renderParams;
            renderParams.renderMode = RenderMode.LINES;
            // renderParams.depthMask = false;
        }
    }

    /**
     * 渲染
     */
    draw(renderer: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const unblenditems = scene.getPickCache(camera).unblenditems;

        const wireframes = unblenditems.reduce((pv: { wireframe: WireframeComponent, renderable: Renderable }[], cv) =>
        {
            const wireframe = cv.getComponent(WireframeComponent); if (wireframe) pv.push({ wireframe, renderable: cv });

            return pv;
        }, []);

        if (wireframes.length === 0)
        {
            return;
        }

        wireframes.forEach((element) =>
        {
            this.drawGameObject(renderer, element.renderable, scene, camera, element.wireframe.color); //
        });
    }

    /**
     * 绘制3D对象
     */
    drawGameObject(renderer: WebGLRenderer, renderable: Renderable, scene: Scene, camera: Camera, wireframeColor = new Color4())
    {
        const renderAtomic = renderable.renderAtomic;
        renderable.beforeRender(renderAtomic, scene, camera);

        const renderMode = lazy.getvalue(renderAtomic.renderParams.renderMode);
        if (renderMode === RenderMode.POINTS
            || renderMode === RenderMode.LINES
            || renderMode === RenderMode.LINE_LOOP
            || renderMode === RenderMode.LINE_STRIP
        )
        { return; }

        this.init();

        const uniforms = this.renderAtomic.uniforms;
        //
        uniforms.u_projectionMatrix = camera.lens.matrix;
        uniforms.u_viewProjection = camera.viewProjection;
        uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix;
        uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        uniforms.u_cameraPos = camera.transform.worldPosition;
        uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);
        uniforms.u_scaleByDepth = camera.getScaleByDepth(1);

        //
        this.renderAtomic.next = renderAtomic;

        //
        const oldIndexBuffer = renderAtomic.index;
        if (oldIndexBuffer.count < 3) return;
        if (!renderAtomic.wireframeindexBuffer || renderAtomic.wireframeindexBuffer.count !== 2 * oldIndexBuffer.count)
        {
            const wireframeindices: number[] = [];
            const indices = lazy.getvalue(oldIndexBuffer.indices);
            for (let i = 0; i < indices.length; i += 3)
            {
                wireframeindices.push(
                    indices[i], indices[i + 1],
                    indices[i], indices[i + 2],
                    indices[i + 1], indices[i + 2],
                );
            }
            renderAtomic.wireframeindexBuffer = new Index();
            renderAtomic.wireframeindexBuffer.indices = wireframeindices;
        }
        renderAtomic.wireframeShader = renderAtomic.wireframeShader || new Shader({ shaderName: 'wireframe' });
        this.renderAtomic.index = renderAtomic.wireframeindexBuffer;

        this.renderAtomic.uniforms.u_wireframeColor = wireframeColor;

        //
        this.renderAtomic.shader = renderAtomic.wireframeShader;
        renderer.render(this.renderAtomic);
        this.renderAtomic.shader = null;
        //
    }
}

/**
 * 线框渲染器
 */
export const wireframeRenderer = new WireframeRenderer();
