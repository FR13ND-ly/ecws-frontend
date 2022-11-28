import { createAction, props } from '@ngrx/store';

export const setSearchText = createAction(
    '[Articles Page] Set Search Text',
    props<{ text : string }>()
)