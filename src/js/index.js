import Search from './models/Search';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import { elements, renderLoader, clearLoader } from './views/base';
import Recipe from './models/Recipe';

/**Global state of the app
 * -search object
 * -current recipe object
 * -shopping list object
 * -Liked recipes
 */

const state = {};
//Search controller
const controlSearch = async () => {
  //1. Get query from view
  const query = searchView.getInput ();

  if (query) {
    //2. New search object and add to state
    state.search = new Search (query);
    //3. Prepare UI for results
    searchView.clearInput ();
    searchView.clearResult ();
    renderLoader (elements.searcRes);
    try {
      //4. Search for recipes
      await state.search.getResults ();

      //5.render results on the UI
      clearLoader ();
      searchView.renderResults (state.search.result);
    } catch (e) {
      alert ('Something went wrong with search...');
    }
  }
};
elements.searchForm.addEventListener ('submit', e => {
  e.preventDefault ();
  controlSearch ();
});

elements.serchResPages.addEventListener ('click', e => {
  const btn = e.target.closest ('.btn-inline');
  if (btn) {
    const goToPage = parseInt (btn.dataset.goto, 10);
    searchView.clearResult ();
    searchView.renderResults (state.search.result, goToPage);
  }
});

//Recipe controller
const controlRecipe = async () => {
  const id = window.location.hash.replace ('#', '');
  if (id) {
    //prepare UI for changes
    recipeView.clearRecipe ();
    renderLoader (elements.recipe);
    //highlight selected recipe
    if (state.search) searchView.highlightSelected (id);
    //create new recipe object
    state.recipe = new Recipe (id);
    try {
      //get recipe data and parse ingredient
      await state.recipe.getRecipe ();
      state.recipe.parseIngredients ();
      //calculate serving and timeout
      state.recipe.calcTime ();
      state.recipe.calcServings ();
      //Render recipe
      clearLoader ();
      recipeView.renderRecipe (state.recipe);
    } catch (e) {
      alert ('Error processing recipe');
    }
  }
};
// window.addEventListener ('hashchange', controlRecipe);
// window.addEventListener ('load', controlRecipe);
['hashchange', 'load'].forEach (event =>
  window.addEventListener (event, controlRecipe)
);

//List controller
const controlList = () => {
  //create a new list if there is none
  if (!state.List) state.list = new List ();
  //add each ingredient to the List
  state.recipe.ingredients.forEach (el => {
    const item = state.list.addItem (el.count, el.unit, el.ingredient);
    listView.renderItem (item);
  });
};

//Handle delete and update list item event
elements.shopping.addEventListener ('click', e => {
  const id = e.target.closest ('.shopping__item').dataset.itemid;
  //Handle the delete button
  if (e.target.matches ('.shopping__delete, .shopping__delete *')) {
    // delete from this.state.
    state.list.deleteItem (id);

    //delete from ui
    listView.deleteItem (id);
  } else if (e.target.matches ('.shopping__count-value')) {
    if (e.target.value > 0) {
      const val = parseFloat (e.target.value, 10);
      state.list.updateCount (id, val);
    }
  }
});
//Handling recipe button clicks

elements.recipe.addEventListener ('click', e => {
  if (e.target.matches ('.btn-decrease, .btn-decrease *')) {
    //decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings ('dec');
      recipeView.updateServingsIngredients (state.recipe);
    }
  } else if (e.target.matches ('.btn-increase, .btn-increase *')) {
    //increase button is clicked
    if (state.recipe.servings <= 11) {
      state.recipe.updateServings ('inc');
      recipeView.updateServingsIngredients (state.recipe);
    }
  } else if (e.target.matches ('.recipe__btn--add, .recipe__btn--add *')) {
    controlList ();
  }
});
