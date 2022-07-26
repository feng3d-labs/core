import { RegisterComponent } from '../component/Component';
import { Renderable } from './Renderable';

declare global
{
    export interface MixinsComponentMap { MeshRenderer: MeshRenderer }
}

/**
 * 网格渲染器
 */
@RegisterComponent()
export class MeshRenderer extends Renderable
{
    __class__: 'feng3d.MeshRenderer';
}
