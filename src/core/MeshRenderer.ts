import { RegisterComponent } from '../ecs/Component';
import { Entity } from '../ecs/Entity';
import { Renderable } from './Renderable';

declare global
{
    interface MixinsComponentMap { MeshRenderer: MeshRenderer }
}

/**
 * 网格渲染器
 */
@RegisterComponent({ name: 'MeshRenderer' })
export class MeshRenderer extends Renderable
{
    __class__: 'feng3d.MeshRenderer';

    static create(name = 'Mesh', callback?: (component: MeshRenderer) => void)
    {
        const entity = new Entity();
        entity.name = name;
        const meshRenderer = entity.addComponent(MeshRenderer, callback);

        return meshRenderer;
    }
}
