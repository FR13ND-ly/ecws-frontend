import { createAction, props } from '@ngrx/store';

export const setLoading = createAction(
    '[Loading Bar] Set Loading',
    props<{ loading : boolean }>()
)