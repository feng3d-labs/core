import { GameObject } from '../ecs/GameObject';
import { Transform } from './Transform';
import { ScriptComponent } from './ScriptComponent';

/**
 * 3d对象脚本
 */
export class Script
{
    /**
     * The game object this component is attached to. A component is always attached to a game object.
     */
    get gameObject(): GameObject
    {
        return this.component.gameObject;
    }

    /**
     * The Transform attached to this Entity (null if there is none attached).
     */
    get transform(): Transform
    {
        return this.component.transform;
    }

    /**
     * 宿主组件
     */
    component: ScriptComponent;

    constructor()
    {
    }

    /**
     * Use this for initialization
     */
    init()
    {

    }

    /**
     * Update is called once per frame
     * 每帧执行一次
     */
    update()
    {

    }

    /**
     * 销毁
     */
    destroy()
    {

    }
}
