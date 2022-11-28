import { ActionReducer } from "@ngrx/store"
import { loadingReducer } from "./loading/loading.reducer"
import { searchTextReducer } from "./search-text/search-text.reducer"

export interface AppState {
    loading : ActionReducer<boolean>,
    searchText : ActionReducer<string>,
}

export let appState : AppState = {
    loading : loadingReducer,
    searchText : searchTextReducer
}