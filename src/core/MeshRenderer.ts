import { decoratorRegisterClass } from '@feng3d/polyfill';
import { RegisterComponent } from '../ecs/Component';
import { GameObject } from '../ecs/GameObject';
import { Renderable } from './Renderable';

declare global
{
    interface MixinsComponentMap { MeshRenderer: MeshRenderer }
}

/**
 * 网格渲染器
 */
@RegisterComponent({ name: 'MeshRenderer' })
@decoratorRegisterClass()
export class MeshRenderer extends Renderable
{
    __class__: 'feng3d.MeshRenderer';

    static create(name = 'Mesh')
    {
        const gameObject = new GameObject();
        gameObject.name = name;
        const meshRenderer = gameObject.addComponent(MeshRenderer);

        return meshRenderer;
    }
}
