import { IEvent as Event } from '@feng3d/event';
import { Box3, Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { RenderAtomic } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { Camera } from '../cameras/Camera';
import { RegisterComponent } from '../ecs/Component';
import { Geometry, GeometryLike } from '../geometry/Geometry';
import { LightPicker } from '../light/pickers/LightPicker';
import { Material } from '../materials/Material';
import { PickingCollisionVO } from '../pick/Raycaster';
import { Scene } from '../scene/Scene';
import { RayCastable } from './RayCastable';

declare global
{
    interface MixinsComponentMap { Renderable: Renderable; }

    interface MixinsNode3D
    {
    }
}

/**
 * 可渲染组件
 *
 * General functionality for all renderers.
 *
 * A renderer is what makes an object appear on the screen. Use this class to access the renderer of any object, mesh or Particle System. Renderers can be disabled to make objects invisible (see enabled), and the materials can be accessed and modified through them (see material).
 *
 * See Also: Renderer components for meshes, particles, lines and trails.
 */
@RegisterComponent({ name: 'Renderable', single: true })
export class Renderable extends RayCastable
{
    readonly renderAtomic = new RenderAtomic();

    /**
     * 几何体
     */
    @oav({ component: 'OAVPick', tooltip: '几何体，提供模型以形状', componentParam: { accepttype: 'geometry', datatype: 'geometry' } })
    @serialize
    @watch('_onGeometryChanged')
    geometry: GeometryLike = Geometry.getDefault('Cube');

    /**
     * 材质
     */
    @oav({ component: 'OAVPick', tooltip: '材质，提供模型以皮肤', componentParam: { accepttype: 'material', datatype: 'material' } })
    @serialize
    get material()
    {
        return this._material || Material.getDefault('Default-Material');
    }
    set material(v)
    {
        this._material = v;
    }
    protected _material: Material;

    @oav({ tooltip: '是否投射阴影' })
    @serialize
    castShadows = true;

    @oav({ tooltip: '是否接受阴影' })
    @serialize
    receiveShadows = true;

    constructor()
    {
        super();
        this._lightPicker = new LightPicker(this);
    }

    init()
    {
        super.init();
        this.on('scenetransformChanged', this._onScenetransformChanged, this);

        this.on('getSelfBounds', this._onGetSelfBounds, this);
    }

    /**
     * 渲染前执行函数
     *
     * 可用于渲染前收集渲染数据，或者更新显示效果等
     *
     * @param renderAtomic
     * @param scene
     * @param camera
     */
    beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
    {
        //
        this.geometry.beforeRender(renderAtomic);
        this.material.beforeRender(renderAtomic);
        this._lightPicker.beforeRender(renderAtomic);

        this.entity.components.forEach((element) =>
        {
            if (element !== this)
            {
                element.beforeRender(renderAtomic, scene, camera);
            }
        });
    }

    /**
     * 与世界空间射线相交
     *
     * @param worldRay 世界空间射线
     *
     * @returns 相交信息
     */
    worldRayIntersection(worldRay: Ray3)
    {
        const localRay = this.node3d.rayWorldToLocal(worldRay);
        const pickingCollisionVO = this.localRayIntersection(localRay);

        return pickingCollisionVO;
    }

    /**
     * 与局部空间射线相交
     *
     * @param ray3D 局部空间射线
     *
     * @returns 相交信息
     */
    localRayIntersection(localRay: Ray3)
    {
        const localNormal = new Vector3();

        // 检测射线与边界的碰撞
        const rayEntryDistance = this.selfLocalBounds.rayIntersection(localRay.origin, localRay.direction, localNormal);
        if (rayEntryDistance === Number.MAX_VALUE)
        { return null; }

        // 保存碰撞数据
        const pickingCollisionVO: PickingCollisionVO = {
            node3d: this.node3d,
            localNormal,
            localRay,
            rayEntryDistance,
            rayOriginIsInsideBounds: rayEntryDistance === 0,
            geometry: this.geometry,
            cullFace: this.material.renderParams.cullFace,
        };

        return pickingCollisionVO;
    }

    /**
     * 销毁
     */
    dispose()
    {
        this.geometry = null;
        this.material = null;
        super.dispose();
    }

    //
    private _lightPicker: LightPicker;

    private _onGeometryChanged(property: string, oldValue: Geometry, value: Geometry)
    {
        if (oldValue)
        {
            oldValue.off('boundsInvalid', this._onBoundsInvalid, this);
        }
        if (value)
        {
            value.on('boundsInvalid', this._onBoundsInvalid, this);
        }
        this.geometry = this.geometry || Geometry.getDefault('Cube');
        this._onBoundsInvalid();
    }

    protected _updateBounds()
    {
        this._selfLocalBounds = this.geometry.bounding;
    }

    protected _onGetSelfBounds(event: Event<{ bounds: Box3[]; }>)
    {
        event.data.bounds.push(this.geometry.bounding);
    }
}
