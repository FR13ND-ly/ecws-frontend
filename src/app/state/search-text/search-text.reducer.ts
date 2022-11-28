import { createReducer, on } from '@ngrx/store'
import { setSearchText } from './search-text.actions';

export const initialState : string = '';

export const searchTextReducer = createReducer(
    initialState,

    on(setSearchText, (state, action) => action.text ),
)
