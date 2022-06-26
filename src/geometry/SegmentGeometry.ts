import { Color4, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialization, serialize } from '@feng3d/serialization';
import { watch } from '@feng3d/watcher';
import { MeshRenderer } from '../core/MeshRenderer';
import { Entity } from '../ecs/Entity';
import { EntityFactory } from '../EntityFactory';
import { Material } from '../materials/Material';
import { Geometry } from './Geometry';

declare global
{
    interface MixinsGeometryTypes
    {
        SegmentGeometry: SegmentGeometry
    }
}

/**
 * 线段组件
 */
export class SegmentGeometry extends Geometry
{
    __class__: 'feng3d.SegmentGeometry';

    protected _name = 'Segment';

    /**
     * 线段列表
     * 修改数组内数据时需要手动调用 invalidateGeometry();
     */
    @serialize
    @oav({ component: 'OAVArray', tooltip: '在指定时间进行额外发射指定数量的粒子', componentParam: { defaultItem: () => new Segment() } })
    @watch('invalidateGeometry')
    segments: Segment[] = [];

    /**
     * 添加线段
     *
     * @param segment 线段
     */
    addSegment(segment: Partial<Segment>)
    {
        const s = new Segment();
        serialization.setValue(s, segment);
        this.segments.push(s);
        this.invalidateGeometry();
    }

    /**
     * 更新几何体
     */
    protected buildGeometry()
    {
        const numSegments = this.segments.length;
        const indices: number[] = [];
        const positionData: number[] = [];
        const colorData: number[] = [];

        for (let i = 0; i < numSegments; i++)
        {
            const element = this.segments[i];
            const start = element.start || Vector3.ZERO;
            const end = element.end || Vector3.ZERO;
            const startColor = element.startColor || Color4.WHITE;
            const endColor = element.endColor || Color4.WHITE;

            indices.push(i * 2, i * 2 + 1);
            positionData.push(start.x, start.y, start.z, end.x, end.y, end.z);
            colorData.push(startColor.r, startColor.g, startColor.b, startColor.a,
                endColor.r, endColor.g, endColor.b, endColor.a);
        }

        this.positions = positionData;
        this.colors = colorData;
        this.indices = indices;
    }
}

/**
 * 线段
 */
export class Segment
{
    /**
     * 起点坐标
     */
    @serialize
    @oav({ tooltip: '起点坐标' })
    start = new Vector3();

    /**
     * 终点坐标
     */
    @serialize
    @oav({ tooltip: '终点坐标' })
    end = new Vector3();

    /**
     * 起点颜色
     */
    @serialize
    @oav({ tooltip: '起点颜色' })
    startColor = new Color4();

    /**
     * 终点颜色
     */
    @serialize
    @oav({ tooltip: '终点颜色' })
    endColor = new Color4();
}

declare global
{
    interface MixinsPrimitiveEntity
    {
        Segment: Entity;
    }
}

EntityFactory.registerPrimitive('Segment', (g) =>
{
    const model = g.addComponent(MeshRenderer);
    model.geometry = new SegmentGeometry();
    model.material = Material.getDefault('Segment-Material');
});
