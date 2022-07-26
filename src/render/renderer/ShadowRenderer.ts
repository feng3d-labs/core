import { Rectangle, Vector3 } from '@feng3d/math';
import { RenderAtomic, Shader, WebGLRenderer } from '@feng3d/renderer';
import { Camera } from '../../cameras/Camera';
import { Renderable } from '../../core/Renderable';
import { DirectionalLight } from '../../light/DirectionalLight';
import { PointLight } from '../../light/PointLight';
import { ShadowType } from '../../light/shadow/ShadowType';
import { SpotLight } from '../../light/SpotLight';
import { Scene } from '../../scene/Scene';
import { FrameBufferObject } from '../FrameBufferObject';

declare global
{
    export interface MixinsRenderAtomic
    {
        shadowShader: Shader;
    }
}

export class ShadowRenderer
{
    private renderAtomic = new RenderAtomic();

    /**
     * 渲染
     */
    draw(gl: WebGLRenderer, scene: Scene, camera: Camera)
    {
        const pointLights = scene.activePointLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < pointLights.length; i++)
        {
            pointLights[i].updateDebugShadowMap(scene, camera);
            this.drawForPointLight(gl, pointLights[i], scene, camera);
        }

        const spotLights = scene.activeSpotLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < spotLights.length; i++)
        {
            spotLights[i].updateDebugShadowMap(scene, camera);
            this.drawForSpotLight(gl, spotLights[i], scene, camera);
        }

        const directionalLights = scene.activeDirectionalLights.filter((i) => i.shadowType !== ShadowType.No_Shadows);
        for (let i = 0; i < directionalLights.length; i++)
        {
            directionalLights[i].updateDebugShadowMap(scene, camera);
            this.drawForDirectionalLight(gl, directionalLights[i], scene, camera);
        }
    }

    private drawForSpotLight(renderer: WebGLRenderer, light: SpotLight, scene: Scene, camera: Camera): any
    {
        const gl = renderer.gl;
        FrameBufferObject.active(gl, light.frameBufferObject);

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const shadowCamera = light.shadowCamera;
        shadowCamera.transform.localToWorldMatrix = light.transform.localToWorldMatrix;

        const renderAtomic = this.renderAtomic;

        // 获取影响阴影图的渲染对象
        const models = scene.getModelsByCamera(shadowCamera);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        //
        renderAtomic.renderParams.useViewPort = true;
        renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);

        //
        renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
        renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
        renderAtomic.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
        renderAtomic.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
        renderAtomic.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
        //
        renderAtomic.uniforms.u_lightType = light.lightType;
        renderAtomic.uniforms.u_lightPosition = light.position;
        renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
        renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;

        castShadowsModels.forEach((renderable) =>
        {
            this.drawGameObject(renderer, renderable, scene, camera);
        });

        light.frameBufferObject.deactive(gl);
    }

    private drawForPointLight(renderer: WebGLRenderer, light: PointLight, scene: Scene, camera: Camera): any
    {
        const gl = renderer.gl;

        FrameBufferObject.active(gl, light.frameBufferObject);

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const vpWidth = light.shadowMapSize.x;
        const vpHeight = light.shadowMapSize.y;

        // These viewports map a cube-map onto a 2D texture with the
        // following orientation:
        //
        //  xzXZ
        //   y Y
        //
        // X - Positive x direction
        // x - Negative x direction
        // Y - Positive y direction
        // y - Negative y direction
        // Z - Positive z direction
        // z - Negative z direction

        // positive X
        cube2DViewPorts[0].init(vpWidth * 2, vpHeight, vpWidth, vpHeight);
        // negative X

        cube2DViewPorts[1].init(0, vpHeight, vpWidth, vpHeight);
        // positive Z
        cube2DViewPorts[2].init(vpWidth * 3, vpHeight, vpWidth, vpHeight);
        // negative Z
        cube2DViewPorts[3].init(vpWidth, vpHeight, vpWidth, vpHeight);
        // positive Y
        cube2DViewPorts[4].init(vpWidth * 3, 0, vpWidth, vpHeight);
        // negative Y
        cube2DViewPorts[5].init(vpWidth, 0, vpWidth, vpHeight);

        const shadowCamera = light.shadowCamera;
        shadowCamera.transform.position = light.transform.position;

        const renderAtomic = this.renderAtomic;

        for (let face = 0; face < 6; face++)
        {
            shadowCamera.transform.lookAt(light.position.addTo(cubeDirections[face]), cubeUps[face]);

            // 获取影响阴影图的渲染对象
            const models = scene.getModelsByCamera(shadowCamera);
            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => i.castShadows);

            //
            renderAtomic.renderParams.useViewPort = true;
            renderAtomic.renderParams.viewPort = cube2DViewPorts[face];

            //
            renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
            renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
            renderAtomic.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
            renderAtomic.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
            renderAtomic.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
            //
            renderAtomic.uniforms.u_lightType = light.lightType;
            renderAtomic.uniforms.u_lightPosition = light.position;
            renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
            renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;

            castShadowsModels.forEach((renderable) =>
            {
                this.drawGameObject(renderer, renderable, scene, camera);
            });
        }
        light.frameBufferObject.deactive(gl);
    }

    private drawForDirectionalLight(renderer: WebGLRenderer, light: DirectionalLight, scene: Scene, camera: Camera): any
    {
        // 获取影响阴影图的渲染对象
        const models = scene.getPickByDirectionalLight(light);
        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        light.updateShadowByCamera(scene, camera, models);

        FrameBufferObject.active(renderer.gl, light.frameBufferObject);

        const gl = renderer.gl;

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const shadowCamera = light.shadowCamera;

        const renderAtomic = this.renderAtomic;
        //
        renderAtomic.renderParams.useViewPort = true;
        renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        //
        renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
        renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
        renderAtomic.uniforms.u_viewMatrix = shadowCamera.transform.worldToLocalMatrix;
        renderAtomic.uniforms.u_cameraMatrix = shadowCamera.transform.localToWorldMatrix;
        renderAtomic.uniforms.u_cameraPos = shadowCamera.transform.worldPosition;
        //
        renderAtomic.uniforms.u_lightType = light.lightType;
        renderAtomic.uniforms.u_lightPosition = shadowCamera.transform.worldPosition;
        renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
        renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;
        //
        castShadowsModels.forEach((renderable) =>
        {
            this.drawGameObject(renderer, renderable, scene, camera);
        });

        light.frameBufferObject.deactive(gl);
    }

    /**
     * 绘制3D对象
     */
    private drawGameObject(gl: WebGLRenderer, renderable: Renderable, scene: Scene, camera: Camera)
    {
        const renderAtomic = renderable.renderAtomic;
        renderable.beforeRender(renderAtomic, scene, camera);
        renderAtomic.shadowShader = renderAtomic.shadowShader || new Shader({ shaderName: 'shadow' });

        //
        this.renderAtomic.next = renderAtomic;
        this.renderAtomic.renderParams.cullFace = renderAtomic.renderParams.cullFace;

        // 使用shadowShader
        this.renderAtomic.shader = renderAtomic.shadowShader;
        gl.render(this.renderAtomic);
        this.renderAtomic.shader = null;
    }
}

/**
 * 阴影图渲染器
 */
export const shadowRenderer = new ShadowRenderer();

const cube2DViewPorts = [
    new Rectangle(), new Rectangle(), new Rectangle(),
    new Rectangle(), new Rectangle(), new Rectangle()
];
const cubeUps = [
    new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)
];
const cubeDirections = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1),
    new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)
];
