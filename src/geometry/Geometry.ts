import { Box3, Matrix4x4, Ray3, Vector3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { Constructor, gPartial } from '@feng3d/polyfill';
import { Attribute, Attributes, CullFace, Index, RenderAtomic } from '@feng3d/renderer';
import { serialization, serialize } from '@feng3d/serialization';
import { AssetType } from '../assets/AssetType';
import { AssetData } from '../core/AssetData';
import { Feng3dObject } from '../core/Feng3dObject';
import { HideFlags } from '../core/HideFlags';
import { geometryUtils } from './GeometryUtils';

declare global
{
    interface MixinsDefaultGeometry { }
    interface MixinsGeometryTypes { }
}

export interface GeometryTypes extends MixinsGeometryTypes { }

export type GeometryLike = GeometryTypes[keyof GeometryTypes];

export interface GeometryEventMap
{
    /**
     * 包围盒失效
     */
    boundsInvalid: Geometry;
}

/**
 * 几何体
 */
export class Geometry<T extends GeometryEventMap = GeometryEventMap> extends Feng3dObject<T>
{
    @oav({ component: 'OAVFeng3dPreView' })
    private preview = '';

    @oav()
    declare name: string;

    /**
     * 资源编号
     */
    assetId: string;

    assetType = AssetType.geometry;

    /**
     * 几何体信息
     */
    @oav({ component: 'OAVMultiText', priority: -10 })
    get geometryInfo()
    {
        const str = [
            `Geometry Info`,
            `  Vertices    ${this.numVertex}`,
            `  Triangles    ${this.numTriangles}`,
            `  Attributes    ${Object.keys(this._attributes).join(',')}`,
        ].join('\n');

        return str;
    }

    /**
     * 索引数据
     */
    get indices()
    {
        this.updateGrometry();

        return this._indexBuffer.indices;
    }

    /**
     * 更新顶点索引数据
     */
    set indices(value: number[])
    {
        this._indexBuffer.indices = value;
    }

    /**
     * 坐标数据
     */
    get positions()
    {
        return this._attributes.a_position.data;
    }

    set positions(value)
    {
        this._attributes.a_position.data = value;
    }

    /**
     * 颜色数据
     */
    get colors()
    {
        return this._attributes.a_color.data;
    }

    set colors(value)
    {
        this._attributes.a_color.data = value;
    }

    /**
     * uv数据
     */
    get uvs()
    {
        return this._attributes.a_uv.data;
    }

    set uvs(value)
    {
        this._attributes.a_uv.data = value;
    }

    /**
     * 法线数据
     */
    get normals()
    {
        return this._attributes.a_normal.data;
    }

    set normals(value)
    {
        this._attributes.a_normal.data = value;
    }

    /**
     * 切线数据
     */
    get tangents()
    {
        return this._attributes.a_tangent.data;
    }

    set tangents(value)
    {
        this._attributes.a_tangent.data = value;
    }

    /**
     * 蒙皮索引，顶点关联的关节索引
     */
    get skinIndices()
    {
        return this._attributes.a_skinIndices.data;
    }

    set skinIndices(value)
    {
        this._attributes.a_skinIndices.data = value;
    }

    /**
     * 蒙皮权重，顶点关联的关节权重
     */
    get skinWeights()
    {
        return this._attributes.a_skinWeights.data;
    }

    set skinWeights(value)
    {
        this._attributes.a_skinWeights.data = value;
    }

    /**
     * 蒙皮索引，顶点关联的关节索引
     */
    get skinIndices1()
    {
        return this._attributes.a_skinIndices1.data;
    }

    set skinIndices1(value)
    {
        this._attributes.a_skinIndices1.data = value;
    }

    /**
     * 蒙皮权重，顶点关联的关节权重
     */
    get skinWeights1()
    {
        return this._attributes.a_skinWeights1.data;
    }

    set skinWeights1(value)
    {
        this._attributes.a_skinWeights1.data = value;
    }

    /**
     * 创建一个几何体
     */
    constructor()
    {
        super();
    }

    /**
     * 标记需要更新几何体，在更改几何体数据后需要调用该函数。
     */
    @oav({ tooltip: '标记需要更新几何体，在更改几何体数据后需要调用该函数。' })
    invalidateGeometry()
    {
        this._geometryInvalid = true;
        this.invalidateBounds();
    }

    /**
     * 更新几何体
     */
    updateGrometry()
    {
        if (this._geometryInvalid)
        {
            this._geometryInvalid = false;
            this.buildGeometry();
        }
    }

    /**
     * 构建几何体
     */
    protected buildGeometry()
    {
    }

    /**
     * 顶点数量
     */
    get numVertex()
    {
        return this.positions.length / 3;
    }

    /**
     * 三角形数量
     */
    get numTriangles()
    {
        return this.indices.length / 3;
    }

    /**
     * 添加几何体
     * @param geometry          被添加的几何体
     * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
     */
    addGeometry(geometry: Geometry, transform?: Matrix4x4)
    {
        // 更新几何体
        this.updateGrometry();
        geometry.updateGrometry();
        // 变换被添加的几何体
        if (transform)
        {
            geometry = geometry.clone();
            geometry.applyTransformation(transform);
        }

        // 如果自身为空几何体
        if (!this.indices)
        {
            this.cloneFrom(geometry);

            return;
        }

        //
        const attributes = this._attributes;
        const addAttributes = geometry._attributes;
        // 当前顶点数量
        const oldNumVertex = this.numVertex;
        // 合并索引
        const indices = this.indices;
        const targetIndices = geometry.indices;
        const totalIndices = indices.concat();
        for (let i = 0; i < targetIndices.length; i++)
        {
            totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
        }
        this.indices = totalIndices;
        // 合并后顶点数量
        // const totalVertex = oldNumVertex + geometry.numVertex;
        // 合并属性数据
        for (const attributeName in attributes)
        {
            const attribute: Attribute = attributes[attributeName];
            const addAttribute: Attribute = addAttributes[attributeName];
            //
            attribute.data = attribute.data.concat(addAttribute.data);
        }
    }

    /**
     * 应用变换矩阵
     * @param transform 变换矩阵
     */
    applyTransformation(transform: Matrix4x4)
    {
        this.updateGrometry();

        const vertices = this.positions;
        const normals = this.normals;
        const tangents = this.tangents;

        geometryUtils.applyTransformation(transform, vertices, normals, tangents);

        this.positions = vertices;
        this.normals = normals;
        this.tangents = tangents;
    }

    /**
     * 纹理U缩放，默认为1。
     */
    @serialize
    @oav()
    scaleU = 1;

    /**
     * 纹理V缩放，默认为1。
     */
    @serialize
    @oav()
    scaleV = 1;

    /**
     * 包围盒失效
     */
    invalidateBounds()
    {
        this._bounding = <any>null;
        this.emit('boundsInvalid', this);
    }

    get bounding()
    {
        this.updateGrometry();
        if (!this._bounding)
        {
            const positions = this.positions;
            if (!positions || positions.length === 0)
            { return new Box3(); }
            this._bounding = Box3.formPositions(this.positions);
        }

        return this._bounding;
    }

    /**
     * 射线投影几何体
     * @param ray                           射线
     * @param shortestCollisionDistance     当前最短碰撞距离
     * @param cullFace                      裁剪面枚举
     */
    raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE)
    {
        const result = geometryUtils.raycast(ray, this.indices, this.positions, this.uvs, shortestCollisionDistance, cullFace);

        return result;
    }

    /**
     * 获取顶点列表
     *
     * @param result
     */
    getVertices(result: Vector3[] = [])
    {
        const positions = this.positions;
        for (let i = 0, n = positions.length; i < n; i += 3)
        {
            result.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }

        return result;
    }

    getFaces(result: number[][] = [])
    {
        const indices = this.indices;
        for (let i = 0, n = indices.length; i < n; i += 3)
        {
            result.push([indices[i], indices[i + 1], indices[i + 2]]);
        }

        return result;
    }

    /**
     * 克隆一个几何体
     */
    clone()
    {
        const Cls = this.constructor as Constructor<Geometry>;
        const geometry = new Cls();
        geometry.cloneFrom(this);

        return geometry;
    }

    /**
     * 从一个几何体中克隆数据
     */
    cloneFrom(geometry: Geometry)
    {
        geometry.updateGrometry();
        this.indices = geometry.indices.concat();
        for (const attributeName in geometry._attributes)
        {
            const attribute: Attribute = this._attributes[attributeName];
            const addAttribute: Attribute = geometry._attributes[attributeName];

            attribute.data = addAttribute.data.concat();
        }
    }

    beforeRender(renderAtomic: RenderAtomic)
    {
        this.updateGrometry();

        renderAtomic.index = this._indexBuffer;

        for (const key in this._attributes)
        {
            if (this._attributes.hasOwnProperty(key))
            {
                renderAtomic.attributes[key] = this._attributes[key];
            }
        }

        renderAtomic.shaderMacro.SCALEU = this.scaleU;
        renderAtomic.shaderMacro.SCALEV = this.scaleV;
    }

    /**
     * 顶点索引缓冲
     */
    private _indexBuffer = new Index();

    /**
     * 属性数据列表
     */
    protected _attributes: Attributes = {
        a_position: new Attribute({ name: 'a_position', data: [], size: 3 }),
        a_color: new Attribute({ name: 'a_color', data: [], size: 4 }),
        a_uv: new Attribute({ name: 'a_uv', data: [], size: 2 }),
        a_normal: new Attribute({ name: 'a_normal', data: [], size: 3 }),
        a_tangent: new Attribute({ name: 'a_tangent', data: [], size: 3 }),
        a_skinIndices: new Attribute({ name: 'a_skinIndices', data: [], size: 4 }),
        a_skinWeights: new Attribute({ name: 'a_skinWeights', data: [], size: 4 }),
        a_skinIndices1: new Attribute({ name: 'a_skinIndices1', data: [], size: 4 }),
        a_skinWeights1: new Attribute({ name: 'a_skinWeights1', data: [], size: 4 }),
    };

    /**
     * 清理数据
     */
    clear()
    {
        for (const key in this._attributes)
        {
            const element: Attribute = this._attributes[key];
            element.data = [];
        }
    }

    private _geometryInvalid = true;
    private _useFaceWeights = false;

    private _bounding: Box3;

    /**
     * 设置默认几何体
     *
     * @param name 默认几何体名称
     * @param geometry 默认几何体
     */
    static setDefault<K extends keyof DefaultGeometry>(name: K, geometry: DefaultGeometry[K], param?: gPartial<DefaultGeometry[K]>)
    {
        this._defaultGeometry[name] = geometry;
        if (param) serialization.setValue(geometry, param);
        serialization.setValue(geometry, { name, assetId: name, hideFlags: HideFlags.NotEditable });
        AssetData.addAssetData(name, geometry);
    }

    /**
     * 获取默认几何体
     *
     * @param name 默认几何体名称
     */
    static getDefault<K extends keyof DefaultGeometry>(name: K)
    {
        return this._defaultGeometry[name];
    }
    private static _defaultGeometry: DefaultGeometry = <any>{};
}

/**
 * 默认几何体
 */
export interface DefaultGeometry extends MixinsDefaultGeometry
{
}
