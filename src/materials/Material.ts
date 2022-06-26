import { globalEmitter } from '@feng3d/event';
import { oav } from '@feng3d/objectview';
import { gPartial, ObjectUtils } from '@feng3d/polyfill';
import { RenderAtomic, RenderMode, RenderParams, Shader, shaderlib } from '@feng3d/renderer';
import { serialization, serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { Feng3dObject } from '../ecs/Feng3dObject';
import { HideFlags } from '../ecs/HideFlags';

export interface UniformsTypes extends MixinsUniformsTypes { }
export type ShaderNames = keyof UniformsTypes;
export type UniformsLike = UniformsTypes[keyof UniformsTypes];

/**
 * 材质
 */
export class Material extends Feng3dObject
{
    __class__: 'feng3d.Material';

    static create<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>)
    {
        const material = new Material();
        material.init(shaderName, uniforms, renderParams);

        return material;
    }

    init<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>)
    {
        this.shaderName = shaderName;
        //
        uniforms && serialization.setValue(this.uniforms, uniforms);
        renderParams && serialization.setValue(this.renderParams, renderParams);

        return this;
    }

    //
    private renderAtomic = new RenderAtomic();

    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    /**
     * shader名称
     */
    @oav({ component: 'OAVMaterialName' })
    @serialize
    @watch('_onShaderChanged')
    shaderName: ShaderNames;

    @oav()
    @serialize
    get name()
    {
        return this._name;
    }
    set name(v)
    {
        this._name = v;
    }
    protected _name = '';

    /**
     * Uniform数据
     */
    @serialize
    @oav({ component: 'OAVObjectView' })
    @watch('_onUniformsChanged')
    uniforms: UniformsLike;

    /**
     * 渲染参数
     */
    @serialize
    @oav({ block: '渲染参数', component: 'OAVObjectView' })
    @watch('_onRenderParamsChanged')
    renderParams = new RenderParams();

    constructor()
    {
        super();
        globalEmitter.on('asset.shaderChanged', this._onShaderChanged, this);
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        Object.assign(renderAtomic.uniforms, this.renderAtomic.uniforms);

        renderAtomic.shader = this.renderAtomic.shader;
        renderAtomic.renderParams = this.renderAtomic.renderParams;
        renderAtomic.shaderMacro.IS_POINTS_MODE = this.renderParams.renderMode === RenderMode.POINTS;
    }

    private _onShaderChanged()
    {
        const Cls = shaderlib.shaderConfig.shaders[this.shaderName].cls;
        if (Cls)
        {
            if (ObjectUtils.objectIsEmpty(this.uniforms) || this.uniforms.constructor !== Cls)
            {
                const newuniforms = new Cls();
                this.uniforms = newuniforms;
            }
        }
        else
        {
            this.uniforms = {} as any;
        }

        const renderParams = shaderlib.shaderConfig.shaders[this.shaderName].renderParams;
        renderParams && serialization.setValue(this.renderParams, renderParams);

        this.renderAtomic.shader = new Shader(this.shaderName);
    }

    private _onUniformsChanged()
    {
        this.renderAtomic.uniforms = this.uniforms as any;
    }

    private _onRenderParamsChanged()
    {
        this.renderAtomic.renderParams = this.renderParams;
    }

    /**
     * 设置默认材质
     *
     * 资源名称与材质名称相同，且无法在检查器界面中编辑。
     *
     * @param name 材质名称
     * @param material 材质数据
     */
    static setDefault<K extends keyof DefaultMaterial>(name: K, material: gPartial<Material>)
    {
        const newMaterial = this._defaultMaterials[name] = new Material();
        serialization.setValue(newMaterial, material);
        serialization.setValue(newMaterial, { name, hideFlags: HideFlags.NotEditable });
    }

    /**
     * 获取材质
     *
     * @param name 材质名称
     */
    static getDefault<K extends keyof DefaultMaterial>(name: K)
    {
        return this._defaultMaterials[name];
    }
    private static _defaultMaterials: DefaultMaterial = {} as any;
}

/**
 * 默认材质
 */
export interface DefaultMaterial extends MixinsDefaultMaterial
{
}
