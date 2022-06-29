import { Color4, Ray3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderMode } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { Animation } from '../animation/Animation';
import { Camera } from '../cameras/Camera';
import { Behaviour } from '../component/Behaviour';
import { Component3D } from '../component/Component3D';
import { Transform } from '../core/Transform';
import { Renderable } from '../core/Renderable';
import { RunEnvironment } from '../core/RunEnvironment';
import { Component, RegisterComponent } from '../ecs/Component';
import { GameObject } from '../ecs/GameObject';
import { HideFlags } from '../ecs/HideFlags';
import { DirectionalLight } from '../light/DirectionalLight';
import { PointLight } from '../light/PointLight';
import { SpotLight } from '../light/SpotLight';
import { SkyBox } from '../skybox/SkyBox';
import { ticker } from '../utils/Ticker';
import { ScenePickCache } from './ScenePickCache';

declare global
{
    /**
     * 组件事件
     */
    interface MixinsEntityEventMap
    {
        addToScene: GameObject;
        removeFromScene: GameObject;
        addComponentToScene: Component;
    }
    interface MixinsComponentMap { Scene: Scene; }
}

/**
 * 3D场景
 */
@RegisterComponent({ name: 'Scene', single: true })
export class Scene extends Component3D
{
    __class__: 'feng3d.Scene';

    /**
     * 背景颜色
     */
    @serialize
    @oav()
    background = new Color4(0, 0, 0, 1);

    /**
     * 环境光强度
     */
    @serialize
    @oav()
    ambientColor = new Color4();

    /**
     * 指定所运行环境
     *
     * 控制运行符合指定环境场景中所有 Behaviour.update 方法
     *
     * 用于处理某些脚本只在在feng3d引擎或者编辑器中运行的问题。例如 FPSController 默认只在feng3d中运行，在编辑器模式下不会运行。
     */
    runEnvironment = RunEnvironment.feng3d;

    /**
     * 鼠标射线，在渲染时被设置
     */
    mouseRay3D: Ray3;

    init()
    {
        super.init();
        this.gameObject.hideFlags = this.gameObject.hideFlags | HideFlags.Hide;
        this.gameObject.hideFlags = this.gameObject.hideFlags | HideFlags.DontTransform;
        //
        this.transform._setScene(this);
    }

    update(interval?: number)
    {
        interval = interval || (1000 / ticker.frameRate);

        this._mouseCheckTransforms = null;
        this._models = null;
        this._visibleAndEnabledModels = null;
        this._skyBoxs = null;
        this._activeSkyBoxs = null;
        this._directionalLights = null;
        this._activeDirectionalLights = null;
        this._pointLights = null;
        this._activePointLights = null;
        this._spotLights = null;
        this._activeSpotLights = null;
        this._animations = null;
        this._activeAnimations = null;
        this._behaviours = null;
        this._activeBehaviours = null;

        // 每帧清理拾取缓存
        this._pickMap.forEach((item) => item.clear());

        this.behaviours.forEach((element) =>
        {
            if (element.isVisibleAndEnabled && Boolean(this.runEnvironment & element.runEnvironment))
            { element.update(interval); }
        });
    }

    /**
     * 所有 Model
     */
    get models()
    {
        this._models = this._models || this.transform.getComponentsInChildren(Renderable);

        return this._models;
    }

    /**
     * 所有 可见且开启的 Model
     */
    get visibleAndEnabledModels()
    {
        if (!this._visibleAndEnabledModels)
        {
            this._visibleAndEnabledModels = this.models.filter((i) => i.isVisibleAndEnabled);
        }

        return this._visibleAndEnabledModels;
    }

    /**
     * 所有 SkyBox
     */
    get skyBoxs()
    {
        this._skyBoxs = this._skyBoxs || this.transform.getComponentsInChildren(SkyBox);

        return this._skyBoxs;
    }

    get activeSkyBoxs()
    {
        if (!this._activeSkyBoxs)
        {
            this._activeSkyBoxs = this.skyBoxs.filter((i) => i.transform.globalVisible);
        }

        return this._activeSkyBoxs;
    }

    get directionalLights()
    {
        if (!this._directionalLights)
        {
            this._directionalLights = this.transform.getComponentsInChildren(DirectionalLight);
        }

        return this._directionalLights;
    }

    get activeDirectionalLights()
    {
        if (!this._activeDirectionalLights)
        {
            this._activeDirectionalLights = this.directionalLights.filter((i) => i.isVisibleAndEnabled);
        }

        return this._activeDirectionalLights;
    }

    get pointLights()
    {
        if (!this._pointLights)
        {
            this._pointLights = this.transform.getComponentsInChildren(PointLight);
        }

        return this._pointLights;
    }

    get activePointLights()
    {
        if (!this._activePointLights)
        {
            this._activePointLights = this.pointLights.filter((i) => i.isVisibleAndEnabled);
        }

        return this._activePointLights;
    }

    get spotLights()
    {
        this._spotLights = this._spotLights || this.transform.getComponentsInChildren(SpotLight);

        return this._spotLights;
    }

    get activeSpotLights()
    {
        this._activeSpotLights = this._activeSpotLights || this.spotLights.filter((i) => i.isVisibleAndEnabled);

        return this._activeSpotLights;
    }

    get animations()
    {
        this._animations = this._animations || this.transform.getComponentsInChildren(Animation);

        return this._animations;
    }

    get activeAnimations()
    {
        this._activeAnimations = this._activeAnimations || this.animations.filter((i) => i.isVisibleAndEnabled);

        return this._activeAnimations;
    }

    get behaviours()
    {
        this._behaviours = this._behaviours || this.transform.getComponentsInChildren(Behaviour);

        return this._behaviours;
    }

    get activeBehaviours()
    {
        this._activeBehaviours = this._activeBehaviours || this.behaviours.filter((i) => i.isVisibleAndEnabled);

        return this._activeBehaviours;
    }

    get mouseCheckObjects(): Transform[]
    {
        if (this._mouseCheckTransforms)
        { return this._mouseCheckTransforms; }

        let checkList = this.transform.getChildren();
        this._mouseCheckTransforms = [];
        let i = 0;
        // 获取所有需要拾取的对象并分层存储
        while (i < checkList.length)
        {
            const checkObject = checkList[i++];
            if (checkObject.mouseEnabled)
            {
                if (checkObject.getComponents(Renderable))
                {
                    this._mouseCheckTransforms.push(checkObject);
                }
                checkList = checkList.concat(checkObject.getChildren());
            }
        }

        return this._mouseCheckTransforms;
    }

    /**
     * 获取拾取缓存
     * @param camera
     */
    getPickCache(camera: Camera)
    {
        if (this._pickMap.get(camera))
        { return this._pickMap.get(camera); }
        const pick = new ScenePickCache(this, camera);
        this._pickMap.set(camera, pick);

        return pick;
    }

    /**
     * 获取接收光照渲染对象列表
     * @param _light
     */
    getPickByDirectionalLight(_light: DirectionalLight)
    {
        const openlist = [this.transform];
        const targets: Renderable[] = [];
        while (openlist.length > 0)
        {
            const item = openlist.shift();
            if (!item.visible) continue;
            const model = item.getComponent(Renderable);
            if (model && (model.castShadows || model.receiveShadows)
                && !model.material.renderParams.enableBlend
                && model.material.renderParams.renderMode === RenderMode.TRIANGLES
            )
            {
                targets.push(model);
            }
            item.children.forEach((element) =>
            {
                openlist.push(element);
            });
        }

        return targets;
    }

    /**
     * 获取 可被摄像机看见的 Model 列表
     * @param camera
     */
    getModelsByCamera(camera: Camera)
    {
        const frustum = camera.frustum;

        const results = this.visibleAndEnabledModels.filter((i) =>
        {
            const model = i.getComponent(Renderable);
            if (model.selfWorldBounds)
            {
                if (frustum.intersectsBox(model.selfWorldBounds))
                { return true; }
            }

            return false;
        });

        return results;
    }

    //
    private _mouseCheckTransforms: Transform[];
    private _models: Renderable[];
    private _visibleAndEnabledModels: Renderable[];
    private _skyBoxs: SkyBox[];
    private _activeSkyBoxs: SkyBox[];
    private _directionalLights: DirectionalLight[];
    private _activeDirectionalLights: DirectionalLight[];
    private _pointLights: PointLight[];
    private _activePointLights: PointLight[];
    private _spotLights: SpotLight[];
    private _activeSpotLights: SpotLight[];
    private _animations: Animation[];
    private _activeAnimations: Animation[];
    private _behaviours: Behaviour[];
    private _activeBehaviours: Behaviour[];
    private _pickMap = new Map<Camera, ScenePickCache>();
}
