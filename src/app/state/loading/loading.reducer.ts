import { createReducer, on } from '@ngrx/store'
import { setLoading } from './loading.actions';

export const initialState : boolean = false;

export const loadingReducer = createReducer(
    initialState,

    on(setLoading, (state, action) => action.loading ),
)
