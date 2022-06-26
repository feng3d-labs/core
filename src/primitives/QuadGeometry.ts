import { MeshRenderer } from '../core/MeshRenderer';
import { Entity } from '../ecs/Entity';
import { EntityFactory } from '../EntityFactory';
import { Geometry } from '../geometry/Geometry';
import { geometryUtils } from '../geometry/GeometryUtils';

declare global
{
    interface MixinsGeometryTypes
    {
        QuadGeometry: QuadGeometry
    }
}

/**
 * 四边形面皮几何体
 */
export class QuadGeometry extends Geometry
{
    __class__: 'feng3d.QuadGeometry';

    constructor()
    {
        super();
        const size = 0.5;

        this.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
        this.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
        this.indices = [0, 1, 2, 0, 2, 3];

        this.normals = geometryUtils.createVertexNormals(this.indices, this.positions, true);
        this.tangents = geometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, true);
    }
}

declare global
{
    interface MixinsDefaultGeometry
    {
        Quad: QuadGeometry;
    }
    interface MixinsPrimitiveEntity
    {
        Quad: Entity;
    }
}
Geometry.setDefault('Quad', new QuadGeometry());

EntityFactory.registerPrimitive('Quad', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Quad');
});
