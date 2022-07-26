import { Matrix4x4 } from '@feng3d/math';
import { RenderAtomic } from '@feng3d/renderer';
import { Renderable } from '../../core/Renderable';
import { Texture2D } from '../../textures/Texture2D';
import { DirectionalLight } from '../DirectionalLight';
import { PointLight } from '../PointLight';
import { ShadowType } from '../shadow/ShadowType';
import { SpotLight } from '../SpotLight';

export class LightPicker
{
    private _model: Renderable;

    constructor(model: Renderable)
    {
        this._model = model;
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        let pointLights: PointLight[] = [];
        let directionalLights: DirectionalLight[] = [];
        let spotLights: SpotLight[] = [];

        const scene = this._model.gameObject.scene;
        if (scene)
        {
            pointLights = scene.activePointLights;
            directionalLights = scene.activeDirectionalLights;
            spotLights = scene.activeSpotLights;
        }

        renderAtomic.shaderMacro.NUM_LIGHT = pointLights.length + directionalLights.length + spotLights.length;

        // 设置点光源数据
        const castShadowPointLights: PointLight[] = [];
        const unCastShadowPointLights: PointLight[] = [];
        const pointShadowMaps: Texture2D[] = [];
        pointLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowPointLights.push(element);
                pointShadowMaps.push(element.shadowMap);
            }
            else
            {
                unCastShadowPointLights.push(element);
            }
        });
        renderAtomic.shaderMacro.NUM_POINTLIGHT = unCastShadowPointLights.length;
        renderAtomic.shaderMacro.NUM_POINTLIGHT_CASTSHADOW = castShadowPointLights.length;
        //
        renderAtomic.uniforms.u_pointLights = unCastShadowPointLights;
        renderAtomic.uniforms.u_castShadowPointLights = castShadowPointLights;
        renderAtomic.uniforms.u_pointShadowMaps = pointShadowMaps;

        // 设置聚光灯光源数据
        const castShadowSpotLights: SpotLight[] = [];
        const unCastShadowSpotLights: SpotLight[] = [];
        const spotShadowMaps: Texture2D[] = [];
        const spotShadowMatrix: Matrix4x4[] = [];
        spotLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowSpotLights.push(element);
                spotShadowMatrix.push(element.shadowCamera.viewProjection);
                spotShadowMaps.push(element.shadowMap);
            }
            else
            {
                unCastShadowSpotLights.push(element);
            }
        });
        renderAtomic.shaderMacro.NUM_SPOT_LIGHTS = unCastShadowSpotLights.length;
        renderAtomic.shaderMacro.NUM_SPOT_LIGHTS_CASTSHADOW = castShadowSpotLights.length;
        //
        renderAtomic.uniforms.u_spotLights = unCastShadowSpotLights;
        renderAtomic.uniforms.u_castShadowSpotLights = castShadowSpotLights;
        renderAtomic.uniforms.u_spotShadowMatrix = spotShadowMatrix;
        renderAtomic.uniforms.u_spotShadowMaps = spotShadowMaps;

        // 设置方向光源数据
        const castShadowDirectionalLights: DirectionalLight[] = [];
        const unCastShadowDirectionalLights: DirectionalLight[] = [];
        const directionalShadowMatrix: Matrix4x4[] = [];
        const directionalShadowMaps: Texture2D[] = [];
        directionalLights.forEach((element) =>
        {
            if (!element.isVisibleAndEnabled) return;
            if (element.shadowType !== ShadowType.No_Shadows && this._model.receiveShadows)
            {
                castShadowDirectionalLights.push(element);
                directionalShadowMatrix.push(element.shadowCamera.viewProjection);
                directionalShadowMaps.push(element.shadowMap);
            }
            else
            {
                unCastShadowDirectionalLights.push(element);
            }
        });

        renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT = unCastShadowDirectionalLights.length;
        renderAtomic.shaderMacro.NUM_DIRECTIONALLIGHT_CASTSHADOW = castShadowDirectionalLights.length;
        //
        renderAtomic.uniforms.u_directionalLights = unCastShadowDirectionalLights;
        renderAtomic.uniforms.u_castShadowDirectionalLights = castShadowDirectionalLights;
        renderAtomic.uniforms.u_directionalShadowMatrixs = directionalShadowMatrix;
        renderAtomic.uniforms.u_directionalShadowMaps = directionalShadowMaps;
    }
}
