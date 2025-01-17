@page place-my-order In-depth guide
@parent Guides
@hide sidebar
@outline 2 ol
@description In this guide you will learn about all of [DoneJS' features](./Features.html) by creating, testing, documenting, building and deploying [place-my-order.com](http://www.place-my-order.com), a restaurant menu and ordering application. The final result will look like this:


<img src="static/img/place-my-order.png" srcset="static/img/place-my-order.png 1x, static/img/place-my-order-2x.png 2x">


After the initial application setup, which includes a server that hosts and pre-renders the application, we will create several custom elements and bring them together using the application state and routes. Then we will learn how to retrieve data from the server using a RESTful API.

After that we will talk about what a view model is and how to identify, implement and test its functionality. Once we have unit tests running in the browser, we will automate running them locally from the command line and also on a continuous integration server. In the subsequent chapters, we will show how to easily import other modules into our application and how to set up a real-time connection.

Finally, we will describe how to build and deploy our application to the web, as a desktop application with Electron, and as a mobile app with Cordova.


@body

## Set up the project

In this section we will create our DoneJS project and set up a RESTful API for the application to use.
You will need [NodeJS](http://nodejs.org) installed and your code editor of choice.

> If you haven't already, check out the [SettingUp] guide to ensure you have all of the prerequisites installed and configured.

### Create the project

To get started, let's install the DoneJS command line utility globally:

```shell
npm install -g donejs@3
```

Then we can create a new DoneJS application:

```shell
donejs add app place-my-order --yes
```

The initialization process will ask you questions like the name of your application (set to `place-my-order`) and the source folder (set to `src`). The other questions can be skipped by hitting enter. This will install all of DoneJS' dependencies. The main project dependencies include:

- [StealJS](https://stealjs.com) - ES6, CJS, and AMD module loader and builder
- [CanJS](https://canjs.com) - Custom elements and Model-View-ViewModel utilities
- [done-ssr](https://github.com/donejs/done-ssr) - Server-rendering
- [QUnit](https://qunitjs.com/) or Mocha - Assertion library
- [FuncUnit](https://funcunit.com) - Functional tests
- [Testee](https://github.com/bitovi/testee) - Test runner

If we now go into the `place-my-order` folder with

```shell
cd place-my-order
```

We can see the following files:

```shell
├── build.js
├── development.html
├── package.json
├── production.html
├── README.md
├── test.html
├── src/
|   ├── app.js
|   ├── index.stache
|   ├── is-dev.js
|   ├── models/
|   |   ├── fixtures
|   |   |   ├── fixtures.js
|   |   ├── test.js
|   ├── styles.less
|   ├── test.js
├── node_modules/
```

Let's have a quick look at the purpose of each:

- [`development.html`](https://github.com/donejs/generator-donejs#developmenthtml), [`production.html`](https://github.com/donejs/generator-donejs#productionhtml) those pages can run the DoneJS application in development or production mode without a server.
- `package.json` is the main configuration file that defines all our application dependencies and other settings.
- `test.html` is used to run all our tests.
- `README.md` is the readme file for your repository.
- `src` is the folder where all our development assets live in their own modlets (more about that later).
- `src/app.js` is the main application file, which exports the main application state.
- `src/index.stache` is the main client template that includes server-side rendering.
- `src/is-dev.js` is used to conditional load modules in development-mode only.
- `src/models/` is the folder where models for the API connection will be put. It currently contains `fixtures/fixtures.js` which will reference all the specific models fixtures files (so that we can run model tests without the need for a running API server) and `test.js` which will later gather all the individual model test files.
- `src/styles.less` is the main application styles.
- `src/test.js` collects all individual component and model tests we will create throughout this guide as well as the functional smoke test for our application and is loaded by `test.html`.

### Development mode

DoneJS comes with its own server, which hosts your development files and takes care of server-side rendering. DoneJS' development mode will also enable [hot module swapping](http://blog.bitovi.com/hot-module-replacement-comes-to-stealjs/) which automatically reloads files in the browser as they change. You can start it by running:

```shell
donejs develop
```

The default port is 8080, so if we now go to [http://localhost:8080/] we can see our application with a default homepage. If we change `src/index.stache` or `src/app.js` all changes will show up right away in the browser. Try it by adding some HTML in `src/index.stache`.

### Setup a service API

Single page applications often communicate with a RESTful API and a [WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) for real-time updates. This guide will not cover how to create a REST API. Instead, we'll just install and start an existing service API created specifically for use with this tutorial:

**Note**: Kill the server for now while we install a few dependencies (ctrl+c on Windows and Mac).

```shell
npm install place-my-order-api@1 --save
```

Now we can add an API server start script into the `scripts` section of our `package.json` like this:

```js
  "scripts": {
    "api": "place-my-order-api --port 7070",
    "test": "testee test.html --browsers firefox --reporter Spec",
    "start": "done-serve --port 8080",
    "develop": "done-serve --develop --port 8080",
    "build": "node build"
  },
```

@highlight 2,2,only

Which allows us to start the server like:

```shell
donejs api
```

The first time it starts, the server will initialize some default data (restaurants and orders). Once started, you can verify that the data has been created and the service is running by going to [http://localhost:7070/restaurants](http://localhost:7070/restaurants), where we can see a JSON list of restaurant data.

### Starting the application

Now our application is good to go and we can start the server. We need to proxy the `place-my-order-api` server to `/api` on our server in order to avoid violating the [same origin policy](https://en.wikipedia.org/wiki/Same-origin_policy). This means that we need to modify the `start` and `develop` script in our `package.json` to:

```js
"scripts": {
  "api": "place-my-order-api --port 7070",
  "test": "testee test.html --browsers firefox --reporter Spec",
  "start": "done-serve --proxy http://localhost:7070 --port 8080",
  "develop": "done-serve --develop --proxy http://localhost:7070 --port 8080",
  "build": "node build"
},
```

@highlight 4,5,only

Now we can start the application with:

```shell
donejs develop
```

Go to [http://localhost:8080](http://localhost:8080) to see the "hello world" message again.

### Loading assets

Before we get to the code, we also need to install the `place-my-order-assets` package which contains the images and styles specifically for this tutorial's application:

```shell
npm install place-my-order-assets@0.1 --save
```

Every DoneJS application consists of at least two files:

 1. **A main template** (in this case `src/index.stache`) which contains the main template and links to the development or production assets.
 1. **A main application view-model** (`src/app.js`) that initializes the application state and routes.

`src/index.stache` was already created for us when we ran `donejs add app`, so update it to
load the static assets and set a `<meta>` tag to support a responsive design:

@sourceref ../../guides/place-my-order/steps/loading-assets/index.stache
@highlight 4,7,only

This is an HTML5 template that uses [can-stache](https://canjs.com/doc/can-stache.html) - a [Handlebars syntax](http://handlebarsjs.com/)-compatible view engine. It renders a `message` property from the application state.

`can-import` loads the template's dependencies:
 1. The `place-my-order-assets` package, which loads the LESS styles for the application
 1. `place-my-order/app`, which is the main application file

The main application file at `src/app.js` looks like this:

```js
// src/app.js
import { DefineMap, route } from 'can';
import RoutePushstate from 'can-route-pushstate';
import debug from 'can-debug#?./is-dev';

//!steal-remove-start
if(debug) {
	debug();
}
//!steal-remove-end

const AppViewModel = DefineMap.extend("AppViewModel", {
  env: {
    default: () => ({NODE_ENV:'development'})
  },
  title: {
    default: 'place-my-order'
  },
  routeData: {
    default: () => route.data
  }
});

route.urlData = new RoutePushstate();
route.register("{page}", { page: "home" });

export default AppViewModel;

```

This initializes a [DefineMap](https://canjs.com/doc/can-define/map/map.html): a special object that acts as the application global state (with a default `message` property) and also plays a key role in enabling server side rendering.

## Creating custom elements

One of the most important concepts in DoneJS is splitting up your application functionality into individual, self-contained modules. In the following section we will create separate components for the homepage, the restaurant list, and the order history page. After that, we will glue them all together using routes and the global application state.

There are two ways of creating components. For smaller components we can define all templates, styles and functionality in a single `.component` file (to learn more see [done-component](https://github.com/donejs/done-component)). Larger components can be split up into several separate files.

### Creating a homepage element

To generate a new component run:

```shell
donejs add component pages/home.component pmo-home
```

This will create a file at `src/pages/home.component` containing the basic ingredients of a component. We will update it to reflect the below content:

@sourceref ../../guides/place-my-order/steps/creating-homepage/home.component
@highlight 8-20,only

Here we created a [can-component](https://canjs.com/doc/can-component.html) named `pmo-home`. This particular component is just a basic template, it does not have much in the way of styles or functionality.

### Create the order history element

We'll create an initial version of order history that is very similar.

```shell
donejs add component pages/order/history.component pmo-order-history
```

And update `src/pages/order/history.component`:

@sourceref ../../guides/place-my-order/steps/creating-oh/history.component
@highlight 8-15,only

### Creating a restaurant list element

The restaurant list will contain more functionality, which is why we will split its template and component logic into separate files.

We can create a basic component like that by running:

```shell
donejs add component pages/restaurant/list pmo-restaurant-list
```

The component's files are collected in a single folder so that components can be easily tested, moved, and re-used. The folder structure looks like this:

```shell
├── node_modules
├── package.json
├── src/
|   ├── app.js
|   ├── index.md
|   ├── index.stache
|   ├── test.js
|   ├── models
|   ├── pages/
|   |   ├── order/
|   |   |   ├── history.component
|   |   ├── restaurant/
|   |   |   ├── list/
|   |   |   |   ├── list.html
|   |   |   |   ├── list.js
|   |   |   |   ├── list.less
|   |   |   |   ├── list.md
|   |   |   |   ├── list.stache
|   |   |   |   ├── list-test.js
|   |   |   |   ├── test.html
```

We will learn more about those files and add more functionality to this element later, but it already contains a fully functional component with a demo page (see [localhost:8080/src/pages/restaurant/list/list.html](http://localhost:8080/src/pages/restaurant/list/list.html)), a basic test (at [localhost:8080/src/pages/restaurant/list/test.html](http://localhost:8080/src/pages/restaurant/list/test.html)) and documentation placeholders.

## Setting up routing

In this part, we will create routes - URL patterns that load specific parts of our single page app. We'll also dynamically load the custom elements we created and integrate them in the application's main page.

### Create Routes

Routing works a bit differently than other libraries. In other libraries, you might declare routes and map those to controller-like actions.

DoneJS application [routes](https://canjs.com/doc/can-route.html) map URL strings (like /user/1) to properties in our application state. In other words, our routes will just be a representation of the application state.

To learn more about routing visit the [CanJS routing guide](https://canjs.com/doc/guides/routing.html).

To add our routes, change `src/app.js` to:

@sourceref ../../guides/place-my-order/steps/create-routes/app.js
@highlight 12-14,28-29,only

Now we have three routes available:

- `{page}` captures urls like [http://localhost:8080/home](http://localhost:8080/home) and sets the `page` property on `routeData` to `home` (which is also the default when visiting [http://localhost:8080/](http://localhost:8080/))
- `{page}/{slug}` matches restaurant links like [http://localhost:8080/restaurants/spago](http://localhost:8080/restaurants/spago) and sets `page` and `slug` (a URL friendly restaurant short name)
- `{page}/{slug}/{action}` will be used to show the order page for a specific restaurant e.g. [http://localhost:8080/restaurants/spago/order](http://localhost:8080/restaurants/spago/order)

### Adding a header element

Now is also a good time to add a header element that links to the different routes we just defined. We can run

```shell
donejs add component components/header.component pmo-header
```

and update `src/components/header.component` to:

@sourceref ../../guides/place-my-order/steps/add-header/header.component
@highlight 8-24,33,only

Here we use [routeUrl](https://canjs.com/doc/can-stache.helpers.routeUrl.html) to create links that will set values in the application state. For example, the first usage of routeUrl above will create a link based on the current routing rules ([http://localhost:8080/home](http://localhost:8080/home) in this case) that sets the `page` property to `home` when clicked.

We also use the Stache `eq` helper to make the appropriate link active.

### Switch between components

Now we can glue all those individual components together. What we want to do is - based on the current page (`home`, `restaurants` or `order-history`) - load the correct component and then initialize it.

Update `src/app.js` to:

@sourceref ../../guides/place-my-order/steps/switch-between/app.js
@highlight 23-44,only

Update `src/index.stache` to:

@sourceref ../../guides/place-my-order/steps/switch-between/index.stache
@highlight 11-12,14-18,only

Here we use a `switch` statement that checks for the current `page` property on the `route.data`, then progressively loads the component with [steal.import](https://stealjs.com/docs/steal.import.html) and [initializes it](https://canjs.com/doc/can-component.html#newComponent__options__).

In the template `{{#if(this.pageComponent.isResolved)}}` shows a loading indicator while the page loads, and then inserts the page (the one instantiated in the Application ViewModel) with `{{this.pageComponent.value}}`.

Now we can see the header and the home component and be able to navigate to the different pages through the header.

## Getting Data from the Server

In this next part, we'll connect to the RESTful API that we set up with `place-my-order-api`, using the powerful data layer provided by [CanJS](https://canjs.com) with [QueryLogic](https://canjs.com/doc/can-query-logic.html) and [realtimeRestModel](https://canjs.com/doc/can-realtime-rest-model.html).

### Creating a restaurants connection

At the beginning of this guide we set up a REST API at [http://localhost:7070](http://localhost:7070) and told `done-serve` to proxy it to http://localhost:8080/api.

To manage the restaurant data located at [http://localhost:8080/api/restaurants](http://localhost:8080/api/restaurants), we'll create a restaurant supermodel:

```js
donejs add supermodel restaurant
```

Answer the question about the URL endpoint with `/api/restaurants` and the name of the id property with `_id`.

We have now created a model and fixtures (for testing without an API) with a folder structure like this:

```shell
├── node_modules
├── package.json
├── src/
|   ├── app.js
|   ├── index.md
|   ├── index.stache
|   ├── test.js
|   ├── models/
|   |   ├── fixtures/
|   |   |   ├── restaurants.js
|   |   ├── fixtures.js
|   |   ├── restaurant.js
|   |   ├── restaurant-test.js
|   |   ├── test.js
```

### Test the connection

To test the connection you can run the following in the browser console. You can access the browser console by right clicking in the browser and selecting **Inspect**. Then switch to the **Console** tab if not already there. Test the connection with:

```js
steal.import("place-my-order/models/restaurant")
  .then(function(module) {
    let Restaurant = module["default"];
    return Restaurant.getList({});
  }).then(function(restaurants) {
    console.log(restaurants);
  });
```

This programmatically imports the `Restaurant` model and uses it to get a list
of all restaurants on the server and log them to the console.

### Add data to the page

Now, update the `ViewModel` in `src/pages/restaurant/list/list.js` to load all restaurants from the restaurant connection:

@sourceref ../../guides/place-my-order/steps/add-data/list.js
@highlight 4,16-20,only

> *Note*: we also removed the __message__ property.

And update the template at `src/pages/restaurant/list/list.stache` to use the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) returned for the `restaurants` property to render the template:

@sourceref ../../guides/place-my-order/steps/add-data/list.stache

By checking for `restaurants.isPending` and `restaurants.isResolved` we are able to show a loading indicator while the data are being retrieved. Once resolved, the actual restaurant list is available at `restaurants.value`. When navigating to the restaurants page now we can see a list of all restaurants.

Note the usage of `routeUrl` to set up a link that points to each restaurant. `slug=slug` is not wrapped in quotes because the helper will populate each restaurant's individual `slug` property in the URL created.

## Creating a unit-tested view model

In this section we will create a view model for the restaurant list functionality.

We'll show a dropdown of all available US states. When the user selects a state, we'll show a list of cities. Once a city is selected, we'll load a list of all restaurants for that city. The end result will look like this:

![Restaurant list](static/img/restaurant-list.png)

### Identify view model state

First we need to identify the properties that our view model needs to provide. We want to load a list of states from the server and let the user select a single state. Then we do the same for cities and finally load the restaurant list for that selection.

All asynchronous requests return a Promise, so the data structure will look like this:

```js
{
 states: Promise<[State]>
 state: String "IL",
 cities: Promise<[City]>,
 city: String "Chicago",
 restaurants: Promise<[Restaurant]>
}
```

### Create dependent models

The API already provides a list of available [states](http://localhost:8080/api/states) and [cities](http://localhost:8080/api/cities). To load them we can create the corresponding models like we already did for Restaurants.

Run:

```shell
donejs add supermodel state
```

When prompted, set the URL to `/api/states` and the id property to `short`.

Run:

```shell
donejs add supermodel city
```

When prompted, set the URL to `/api/cities` and the id property to `name`.

Now we can load a list of states and cities.

### Implement view model behavior

Now that we have identified the view model properties needed and have created the models necessary to load them, we can [define](https://canjs.com/doc/can-define/map/map.html) the `states`, `state`, `cities` and `city` properties in the view model at `src/pages/restaurant/list/list.js`:

@sourceref ../../guides/place-my-order/steps/create-dependent/list.js
@highlight 5-6,18-56,only

Let's take a closer look at those properties:

- `states` will return a list of all available states by calling `State.getList({})`
- `state` is a string property set to `null` by default (no selection).
- `cities` will return `null` if no state has been selected. Otherwise, it will load all the cities for a given state by sending `state` as a query paramater (which will make a request like [http://localhost:8080/api/cities?state=IL](http://localhost:8080/api/cities?state=IL))
- `city` is a string, set to `null` by default. It [listens to](https://canjs.com/doc/can-define.types.valueOptions.html) itself being set and resolves to that value. Additionally it listens to `state` and resolves back to `null` when it changes.
- `restaurants` will always be `null` unless both a `city` and a `state` are selected. If both are selected, it will set the `address.state` and `address.city` query parameters which will return a list of all restaurants whose address matches those parameters.

### Create a test

View models that are decoupled from the presentation layer are easy to test. We will use [QUnit](https://qunitjs.com/) as the testing framework by loading a StealJS-friendly wrapper (`steal-qunit`). The component generator created a fully working test page for the component, which can be opened at [http://localhost:8080/src/pages/restaurant/list/test.html](http://localhost:8080/src/pages/restaurant/list/test.html). Currently, the tests will fail because we changed the view model, but in this section we will create some unit tests for the new functionality.

#### Fixtures: Create fake data

Unit tests should be able to run by themselves without the need for an API server. This is where [fixtures](https://canjs.com/doc/can-fixture.html) come in. Fixtures allow us to mock requests to the REST API with data that we can use for tests or demo pages. Default fixtures will be provided for every generated model. Now we'll add more realistic fake data by updating `src/models/fixtures/states.js` to:

@sourceref ../../guides/place-my-order/steps/create-test/states.js
@highlight 4-7,only

Update `src/models/fixtures/cities.js` to look like:

@sourceref ../../guides/place-my-order/steps/create-test/cities.js
@highlight 4-7,only

Update `src/models/fixtures/restaurants.js` to look like:

@sourceref ../../guides/place-my-order/steps/create-test/restaurants.js
@highlight 4-30,only

#### Test the view model

With fake data in place, we can test our view model by changing `src/pages/restaurant/list/list-test.js` to:

@sourceref ../../guides/place-my-order/steps/create-test/list-test.js

These unit tests are comparing expected data (what we we defined in the fixtures) with actual data (how the view model methods are behaving). Visit [http://localhost:8080/src/pages/restaurant/list/test.html](http://localhost:8080/src/pages/restaurant/list/test.html) to see all tests passing.

### Write the template

Now that our view model is implemented and tested, we'll update the restaurant list template to support the city/state selection functionality.

Update `src/pages/restaurant/list/list.stache` to:

@sourceref ../../guides/place-my-order/steps/write-template/list.stache
@highlight 5-38,only

Some things worth pointing out:

- Since `states` and `cities` return a promise, we can check the promise's status via `isResolved` and `isPending` and once resolved get the actual value with `states.value` and `cities.value`. This also allows us to easily show loading indicators and disable the select fields while loading data.
- The `state` and `city` properties are two-way bound to their select fields via [value:bind](https://canjs.com/doc/can-stache-bindings.twoWay.html#___child_prop____key_)

Now we have a component that lets us select state and city and displays the appropriate restaurant list.

### Update the demo page

We already have an existing demo page at [src/pages/restaurant/list/list.html](http://localhost:8080/src/pages/restaurant/list/list.html). We'll update it to load fixtures so it can demonstrate the use of the pmo-restaurnt-list component:

@sourceref ../../guides/place-my-order/steps/write-template/list.html
@highlight 4-5,only

View the demo page at [http://localhost:8080/src/pages/restaurant/list/list.html](http://localhost:8080/src/pages/restaurant/list/list.html) .

## Automated tests

In this chapter we will automate running the tests so that they can be run from from the command line.

### Using the global test page

We already worked with an individual component test page in [src/pages/restaurant/list/test.html](http://localhost:8080/pages/src/pages/restaurant/list/test.html) but we also have a global test page available at [test.html](http://localhost:8080/test.html). All tests are being loaded in `src/test.js`. Since we don't have tests for our models at the moment, let's remove the `import 'place-my-order/models/test';` part so that `src/test.js` looks like this:

@sourceref ../../guides/place-my-order/steps/test-runner/test.js

If you now go to [http://localhost:8080/test.html](http://localhost:8080/test.html) we still see all restaurant list tests passing but we will add more here later on.

### Using a test runner

**Note**: If you are using Firefox for development, close the browser temporarily so that we can run our tests.

The tests can be automated with any test runner that supports running QUnit tests. We will use [Testee](https://github.com/bitovi/testee) which makes it easy to run those tests in any browser from the command line without much configuration. In fact, everything needed to automatically run the `test.html` page in Firefox is already set up and we can launch the tests by running:

```shell
donejs test
```

To see the tests passing on the command line.

## Continuous integration

Now that the tests can be run from the command line we can automate it in a [continuous integration](https://en.wikipedia.org/wiki/Continuous_integration) (CI) environment to run all tests whenever a code change is made. We will use [GitHub](https://github.com) to host our code and [TravisCI](https://travis-ci.org/) as the CI server.

### Creating a GitHub account and repository

If you don't have an account yet, go to [GitHub](https://github.com) to sign up and follow [the help](https://help.github.com/articles/set-up-git/) on how to set it up for use with the command-line `git`. Once completed, you can create a new repository from your dashboard. Calling the repository `place-my-order` and initializing it empty (without any of the default files) looks like this:

![Creating a new repository on GitHub](static/img/guide-create-repo.png)

Now we have to initialize Git in our project folder and add the GitHub repository we created as the origin remote (replace `<your-username>` with your GitHub username):

```shell
git init
git remote add origin https://github.com/<your-username>/place-my-order.git
```

Then we can add all files and push to origin like this:

```shell
git add --all
git commit -am "Initial commit"
git push origin master
```

If you now go to [github.com/<your-username>/place-my-order](https://github.com/<your-username>/place-my-order) you will see the project files in the repository.

### Setting up Travis CI

The way our application is set up, now all a continuous integration server has to do is clone the application repository, run `npm install`, and then run `npm test`. There are many open source CI servers, the most popular one probably [Jenkins](https://jenkins-ci.org/), and many hosted solutions like [Travis CI](https://travis-ci.org/).

We will use Travis as our hosted solution because it is free for open source projects. It works with your GitHub account which it will use to sign up. First, [sign up](https://travis-ci.org/), then go to `Accounts` (in the dropdown under you name) to enable the `place-my-order` repository:

![Enabling the repository on Travis CI](static/img/guide-travis-ci.png)

Continuous integration on GitHub is most useful when using [branches and pull requests](https://help.github.com/categories/collaborating-on-projects-using-pull-requests/). That way your main branch (master) will only get new code changes if all tests pass. Let's create a new branch with

```shell
git checkout -b travis-ci
```

Run the [donejs-travis](https://github.com/donejs/donejs-travis/) generator to add a `.travis.yml` file to our project root, and to add a *Build Passing* badge to the top of `readme.md`:

```shell
donejs add travis
```

When prompted, confirm the GitHub user name and repository by pressing the Enter key, you can also enter new values if needed:

```shell
? What is the GitHub owner name? (<your-username>)
? What is the GitHub repository name? (place-my-order)
```

Following these questions, the generator will first update the [package.json's repository](https://docs.npmjs.com/files/package.json#repository) field to point it to where your code lives.

Confirm the changes by pressing the Enter key,

```
 conflict package.json
? Overwrite package.json? (Ynaxdh)
```

> You can also press the `d` key to see a diff of the changes before writing to the file.

Then, the generator creates a `.travis.yml` file and updates `readme.md` to include a badge indicating the status of the build, confirm the changes by pressing the Enter key:

```shell
conflict README.md
? Overwrite README.md? (Ynaxdh)
```

The generated `.travis.yml` should look like this:

```shell
language: node_js
node_js: node
addons:
  firefox: latest
before_install:
  - 'export DISPLAY=:99.0'
  - sh -e /etc/init.d/xvfb start
```

By default Travis CI runs `npm test` for NodeJS projects which is what we want. `before_install` sets up a window system to run Firefox.

To see Travis run, let's add all changes and push to the branch:

```shell
git add --all
git commit -am "Enabling Travis CI"
git push origin travis-ci
```

And then create a new pull request by going to [github.com/<your-username>/place-my-order](https://github.com/<your-username>/place-my-order) which will now show an option for it:

![Creating a new pull request on GitHub](static/img/guide-github-pr.png)

Once you created the pull request, you will see a `Some checks haven’t completed yet` message that will eventually turn green like this:

![Merging a pull request with all tests passed](static/img/guide-merge-pr.png)

Once everything turns green, click the "Merge pull request" button.  Then in your console, checkout the _master_ branch and pull down it's latest with:

```shell
git checkout master
git pull origin master
```


## Nested routes

In this section, we will add additional pages that are shown under nested urls such as `restaurants/cheese-curd-city/order`.

<div></div>

Until now we've used three top level routes: `home`, `restaurants` and `order-history`. We did however also define two additional routes in `src/app.js` which looked like:

```js
route.register('{page}/{slug}', { slug: null });
route.register('{page}/{slug}/{action}', { slug: null, action: null });
```

We want to use those routes when we are in the `restaurants` page. The relevant section in `pageComponent` currently looks like this:

```js
case 'restaurants': {
  return steal.import('~/pages/restaurant/list/').then(({default: RestaurantList}) => {
    return new RestaurantList();
  });
}
```

We want to support two additional routes:

- `restaurants/{slug}`, which shows a details page for the restaurant with `slug` being a URL friendly short name for the restaurant
- `restaurants/{slug}/order`, which shows the menu of the current restaurant and allows us to make a selection and then send our order.

### Create additional components

To make this happen, we need two more components. First, the `pmo-restaurant-details` component which loads the restaurant (based on the `slug`) and displays its information.

```shell
donejs add component pages/restaurant/details.component pmo-restaurant-details
```

And change `src/pages/restaurant/details.component` to:

@sourceref ../../guides/place-my-order/steps/additional/details.component

The order component will be a little more complex, which is why we will put it into its own folder:

```shell
donejs add component pages/order/new pmo-order-new
```

For now, we will just use placeholder content and implement the functionality in
the following chapters.

### Add to the Application ViewModel routing

Now we can add those components to the `pageComponent` property (at `src/app.js`) with conditions based on the routes that we want to match. Update `src/app.js` with:

@sourceref ../../guides/place-my-order/steps/additional/app.js
@highlight 1,33-57,only

Here we are adding some more conditions if `page` is set to `restaurants`:

- When there is no `slug` set, show the original restaurant list
- When `slug` is set but no `action`, show the restaurant details
- When `slug` is set and `action` is `order`, show the order component for that restaurant

As before, we import the page component based on the state of the route. Since the page component is a class, we can call `new` to create a new instance. Then we use [can-value](https://canjs.com/doc/can-value.from.html) to bind the `slug` from the route to the component.

## Importing other projects

The npm integration of StealJS makes it very easy to share and import other components. One thing we want to do when showing the `pmo-order-new` component is have a tab to choose between the lunch and dinner menu. The good news is that there is already a [bit-tabs](https://github.com/bitovi-components/bit-tabs) component which does exactly that. Let's add it as a project dependency with:

```shell
npm install bit-tabs@2 --save
```

And then integrate it into `src/pages/order/new/new.stache`:

@sourceref ../../guides/place-my-order/steps/bit-tabs/new.stache

Here we just import the `unstyled` module from the `bit-tabs` package using `can-import` which will then provide the `bit-tabs` and `bit-panel` custom elements.

## Creating data

In this section, we will update the order component to be able to select restaurant menu items and submit a new order for a restaurant.

### Creating the order model

First, let's look at the restaurant data we get back from the server. It looks like this:

```js
{
  "_id": "5571e03daf2cdb6205000001",
  "name": "Cheese Curd City",
  "slug": "cheese-curd-city",
  "images": {
    "thumbnail": "images/1-thumbnail.jpg",
    "owner": "images/1-owner.jpg",
    "banner": "images/2-banner.jpg"
  },
  "menu": {
    "lunch": [
      {
        "name": "Spinach Fennel Watercress Ravioli",
        "price": 35.99
      },
      {
        "name": "Chicken with Tomato Carrot Chutney Sauce",
        "price": 45.99
      },
      {
        "name": "Onion fries",
        "price": 15.99
      }
    ],
    "dinner": [
      {
        "name": "Gunthorp Chicken",
        "price": 21.99
      },
      {
        "name": "Herring in Lavender Dill Reduction",
        "price": 45.99
      },
      {
        "name": "Roasted Salmon",
        "price": 23.99
      }
    ]
  },
  "address": {
    "street": "1601-1625 N Campbell Ave",
    "city": "Green Bay",
    "state": "WI",
    "zip": "60045"
  }
}
```

We have a `menu` property which provides a `lunch` and `dinner` option (which will show later inside the tabs we set up in the previous chapter). We want to be able to add and remove items from the order, check if an item is in the order already, set a default order status (`new`), and be able to calculate the order total. For that to happen, we need to create a new `item` model:

@sourceref ../../guides/place-my-order/steps/create-data/item.js
@highlight 1-24,only

And generate `order` model:

```shell
donejs add supermodel order
```

Like the restaurant model, the URL is `/api/orders` and the id property is `_id`. To select menu items, we need to add some additional functionality to `src/models/order.js`:

@sourceref ../../guides/place-my-order/steps/create-data/order.js
@highlight 3,11-32,only

Add `menu` property to the `restaurant` model in `src/models/restaurant.js`:

@sourceref ../../guides/place-my-order/steps/create-data/restaurant.js
@highlight 3,12-21,only

Here we define an `ItemsList` which allows us to toggle menu items and check if they are already in the order. We set up ItemsList as the Value of the items property of an order so we can use its has function and toggle directly in the template. We also set a default value for status and a getter for calculating the order total which adds up all the item prices. We also create another `<order-model>` tag to load orders in the order history template later.

### Implement the view model

Now we can update the view model in `src/pages/order/new/new.js`:

@sourceref ../../guides/place-my-order/steps/create-data/new.js
@highlight 4-5,14,18-32,41-50,only

Here we just define the properties that we need: `slug`, `order`, `canPlaceOrder` - which we will use to enable/disable the submit button - and `saveStatus`, which will become a promise once the order is submitted. `placeOrder` updates the order with the restaurant information and saves the current order. `startNewOrder` allows us to submit another order.

While we're here we can also update our test to get it passing again, replace `src/pages/order/new/new-test.js` with:

@sourceref ../../guides/place-my-order/steps/create-data/new-test.js
@highlight 7-12,only

### Write the template

First, let's implement a small order confirmation component with

```shell
donejs add component components/order/details.component pmo-order-details
```

and changing `src/components/order/details.component` to:

@sourceref ../../guides/place-my-order/steps/create-data/details.component

Now we can import that component and update `src/pages/order/new/new.stache` to:

@sourceref ../../guides/place-my-order/steps/create-data/new.stache

This is a longer template so lets walk through it:

- `<can-import from="place-my-order/order/details.component" />` loads the order details component we previously created
- If the `saveStatus` promise is resolved we show the `pmo-order-details` component with that order
- Otherwise we will show the order form with the `bit-tabs` panels we implemented in the previous chapter and iterate over each menu item
- `on:submit="this.placeOrder()"` will call `placeOrder` from our view model when the form is submitted
- The interesting part for showing a menu item is the checkbox `<input type="checkbox" on:change="this.order.items.toggle(item)" {{#if this.order.items.has(item)}}checked{{/if}}>`
  - `on:change` binds to the checkbox change event and runs `this.order.items.toggle` which toggles the item from `ItemList`, which we created in the model
  - `this.order.item.has` sets the checked status to whether or not this item is in the order
- Then we show form elements for name, address, and phone number, which are bound to the order model using [can-stache-bindings](https://canjs.com/doc/can-stache-bindings.html)
- Finally we disable the button with `{{^if(this.canPlaceOrder)}}disabled{{/if}}` which gets `canPlaceOrder` from the view model and returns false if no menu items are selected.

## Set up a real-time connection

can-connect makes it very easy to implement real-time functionality. It is capable of listening to notifications from the server when server data has been created, updated, or removed. This is usually accomplished via [websockets](https://en.wikipedia.org/wiki/WebSocket), which allow sending push notifications to a client.

### Add the Status enum type

Update `src/models/order.js` to use [QueryLogic.makeEnum](https://canjs.com/doc/can-query-logic.makeEnum.html) so that we can declare all of the possible values for an order's `status`.

@sourceref ../../guides/place-my-order/steps/real-time/order-model.js
@highlight 1,4,19-20,only

### Update the template

First let's create the `pmo-order-list` component with:

```shell
donejs add component components/order/list.component pmo-order-list
```

And then change `src/components/order/list.component` to:

@sourceref ../../guides/place-my-order/steps/real-time/list.component

Also update the order history template by changing `src/pages/order/history.component` to:

@sourceref ../../guides/place-my-order/steps/real-time/history.component

First we import the order model and then just call `<order-model get-list="{status='<status>'}">` for each order status. These are all of the template changes needed, next is to set up the real-time connection.

### Adding real-time events to a model

The `place-my-order-api` module uses the [Feathers](https://feathersjs.com/) NodeJS framework, which in addition to providing a REST API, sends those events in the form of a websocket event like `orders created`. To make the order page update in real-time, all we need to do is add listeners for those events to `src/models/order.js` and in the handler notify the order connection.

```shell
npm install steal-socket.io@4 --save
```

Update `src/models/order.js` to use socket.io to update the Order model in real-time:

@sourceref ../../guides/place-my-order/steps/real-time/order.js
@highlight 3,49-53,only

That's it. If we now open the [order page](http://localhost:8080/order-history) we see some already completed default orders. Keeping the page open and placing a new order from another browser or device will update our order page automatically.

## Create documentation

Documenting our code is very important to quickly get other developers up to speed. [DocumentJS](https://documentjs.com/) makes documenting code easier. It will generate a full documentation page from Markdown files and code comments in our project.

### Installing and Configuring DocumentJS

Let's add DocumentJS to our application:

```shell
donejs add documentjs@0.1
```

This will install DocumentJS and also create a `documentjs.json` configuration file. Now we can generate the documentation with:

```shell
donejs document
```

This produces documentation at [http://localhost:8080/docs/](http://localhost:8080/docs/).

### Documenting a module

Let's add the documentation for a module. Let's use `src/pages/order/new/new.js` and update it with some inline comments that describe what our view model properties are supposed to do:

@sourceref ../../guides/place-my-order/steps/document/new.js
@highlight 11-13,19-24,30-35,37-42,46-51,55-59,65-70,83-87,94-98,only

If we now run `donejs document` again, we will see the module show up in the menu bar and will be able to navigate through the different properties.

## Production builds

Now we're ready to create a production build; go ahead and kill your development server, we won't need it from here on.

### Progressive loading

Our `app.js` contains steal.import() calls for each of the pages we have implemented. These dynamic imports progressively load page components only when the user visits that page.

### Bundling assets

Likely you have assets in your project other than your JavaScript and CSS that you will need to deploy to production. Place My Order has these assets saved to another project, you can view them at `node_modules/place-my-order-assets/images`.

StealTools comes with the ability to bundle all of your static assets into a folder that can be deployed to production by itself. Think if it as a zip file that contains everything your app needs to run in production.

To use this capability add an option to your build script to enable it. Change:

```js
let buildPromise = stealTools.build({
  config: __dirname + "/package.json!npm"
}, {
  bundleAssets: true
});
```

to:

```js
let buildPromise = stealTools.build({
  config: __dirname + "/package.json!npm"
}, {
  bundleAssets: {
    infer: false,
    glob: "node_modules/place-my-order-assets/images/**/*"
  }
});
```

@highlight 4-7,only

StealTools will find all of the assets you reference in your CSS and copy them to the dist folder. By default StealTools will set your [dest](https://stealjs.com/docs/steal-tools.build.html#dest) to `dist`, and will place the place-my-order-assets images in `dist/node_modules/place-my-order/assets/images`. bundleAssets preserves the path of your assets so that their locations are the same relative to the base url in both development and production.


### Bundling your app

To bundle our application for production we use the build script in `build.js`. We could also use [Grunt](http://gruntjs.com/) or [Gulp](http://gulpjs.com/), but in this example we just run it directly with Node. Everything is set up already so we run:

```shell
donejs build
```

This will build the application to a `dist/` folder in the project's base directory.

From here your application is ready to be used in production. Enable production mode by setting the `NODE_ENV` variable:

```shell
NODE_ENV=production donejs start
```

If you're using Windows omit the NODE_ENV=production in the command, and instead see the [setting up guide](./SettingUp.html#environmental-variables) on how to set environment variables.

Refresh your browser to see the application load in production.

## Desktop and mobile apps

### Building to iOS and Android

To build the application as a Cordova based mobile application, you need to have each platform's SDK installed.
We'll be building an iOS app if you are a Mac user, and an Android app if you're a Windows user.

Mac users should download XCode from the AppStore and install the `ios-sim` package globally with:

```shell
npm install -g ios-sim
```

We will use these tools to create an iOS application that can be tested in the iOS simulator.

Windows users should install the [Android Studio](https://developer.android.com/sdk/index.html), which gives all of the tools we need. See the [setting up guide](./SettingUp.html#android-development-1) for full instructions on setting up your Android emulator.

Now we can install the DoneJS Cordova tools with:

```shell
donejs add cordova@2
```

Answer the question about the URL of the service layer with `http://www.place-my-order.com`.

Depending on your operating system you can accept most of the rest of the defaults, unless you would like to build for Android, which needs to be selected from the list of platforms.

This will change your `build.js` script with the options needed to build iOS/Android apps. Open this file and add the place-my-order-asset images to the **glob** property:

```js
let cordovaOptions = {
  buildDir: "./build/cordova",
  id: "com.donejs.placemyorder",
  name: "place my order",
  platforms: ["ios"],
  plugins: ["cordova-plugin-transport-security"],
  index: __dirname + "/production.html",
  glob: [
    "node_modules/place-my-order-assets/images/**/*"
  ]
};
```

@highlight 9,only

To run the Cordova build and launch the simulator we can now run:

```shell
donejs build cordova
```

If everything went well, we should see the emulator running our application.

### Building to Electron

To set up the desktop build, we have to add it to our application like this:

```shell
donejs add electron@2
```

Answer the question about the URL of the service layer with `http://www.place-my-order.com`. We can answer the rest of the prompts with the default.

Then we can run the build like this:

```shell
donejs build electron
```

The macOS application can be opened with

```shell
open build/place-my-order-darwin-x64/place-my-order.app
```

The Windows application can be opened with

```shell
.\build\place-my-order-win32-x64\place-my-order.exe
```

## Deploy

Now that we verified that our application works in production, we can deploy it to the web. In this section, we will use [Firebase](https://www.firebase.com/), a service that provides static file hosting and [Content Delivery Network](https://en.wikipedia.org/wiki/Content_delivery_network) (CDN) support, to automatically deploy and serve our application's static assets from a CDN and [Heroku](https://heroku.com) to provide server-side rendering.

### Static hosting on Firebase

Sign up for free at [Firebase](https://firebase.google.com/). After you have an account go to [Firebase console](https://console.firebase.google.com/) and create an app called `place-my-order-<user>` where `<user>` is your GitHub username:

<img src="static/img/guide-firebase-setup.png" alt="two browsers" style="box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2); border-radius: 5px; border: 1px #E7E7E7 solid; max-width: 400px;" />

Write down the name of your app's ID because you'll need it in the next section.

> You will get an error if your app name is too long, so pick something on the shorter side, for example `pmo-<user>`.

When you deploy for the first time it will ask you to authorize with your login information, but first we need to configure the project.

#### Configuring DoneJS

With the Firebase account and application in place we can add the deployment configuration to our project like this:

```shell
donejs add firebase@1
```

When prompted, enter the name of the application created when you set up the Firebase app. Next, login to the firebase app for the first time by running:

```shell
node_modules/.bin/firebase login
```

And authorize your application.

#### Run deploy

We can now deploy the application by running:

```shell
donejs build
donejs deploy
```

Static files are deployed to Firebase and we can verify that the application is loading from the CDN by loading it running:

```shell
NODE_ENV=production donejs start
```

> If you're using Windows, set the NODE_ENV variable as you did previously in the Production section.

We should now see our assets being loaded from the Firebase CDN like this:

![A network tab when using the CDN](static/img/guide-firebase-network.png)

### Deploy your Node code

At this point your application has been deployed to a CDN. This contains StealJS, your production bundles and CSS, and any images or other static files. You still need to deploy your server code in order to get the benefit of server-side rendering.

If you do not have an account yet, sign up for Heroku at [signup.heroku.com](https://signup.heroku.com/). Then download the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command) which will be used to deploy.

After installing run the [donejs-heroku](https://github.com/donejs/donejs-heroku) generator via:

```shell
donejs add heroku
```

Once you have logged in into your Heroku account, choose whether you want Heroku to use a random
name for the application. If you choose not to use a random name, you will be prompted to enter
the application name:

> We recommend you to use a random name since Heroku fails to create the app if the name is already taken.

```shell
? Do you want Heroku to use a random app name? Yes
```

When prompted, press the `Y` key since the application requires a proxy

```shell
? Does the application require a Proxy? Yes
```

Then enter `http://www.place-my-order.com/api` as the proxy url:

```shell
? What's the Proxy url? http://www.place-my-order.com/api
```

Once the generator finishes, update the NODE_ENV variable via:

```shell
heroku config:set NODE_ENV=production
```

and follow the generator instructions to save our current changes:

```shell
git add --all
git commit -m "Finishing place-my-order"
git push origin master
```

Since Heroku needs the build artifacts we need to commit those before pushing to Heroku. We recommend doing this in a separate branch.

```shell
git checkout -b deploy
git add -f dist
git commit -m "Deploying to Heroku"
```

And finally do an initial deploy.

```shell
git push heroku deploy:master
```

Any time in the future you want to deploy simply push to the Heroku remote. Once the deploy is finished you can open the link provided in your browser. If successful we can checkout the _master_ branch:

```shell
git checkout master
```

### Continuous Deployment

Previously we set up Travis CI [for automated testing](#continuous-integration) of our application code as we developed, but Travis (and other CI solutions) can also be used to deploy our code to production once tests have passed.

In order to deploy to Heroku you need to provide Travis with your Heroku API key. Sensitive information in our `.travis.yml` should always be encrypted, and the generator takes care of encrypting the API key using the [travis-encrypt](https://www.npmjs.com/package/travis-encrypt) module.

*Note: if using Windows, first install the OpenSSL package as described in the [Setting Up](https://donejs.com/SettingUp.html) guide.*

Run the [donejs-travis-deploy-to-heroku](https://github.com/donejs/donejs-travis-deploy-to-heroku) generator like this:

```shell
donejs add travis-deploy-to-heroku
```

When prompted, confirm each prompt by pressing the Enter key (or enter new values if needed) and then confirm the changes made to the `.travis.yml` file.

The updated `.travis.yml` should look like this:

```yaml
language: node_js
node_js: node
addons:
  firefox: latest
before_install:
  - 'export DISPLAY=:99.0'
  - sh -e /etc/init.d/xvfb start
deploy:
  skip_cleanup: true
  provider: heroku
  app: <heroku-appname>
  api_key: <encrypted-heroku-api-key>
before_deploy:
  - git config --global user.email "me@example.com"
  - git config --global user.name "deploy bot"
  - node build
  - git add dist/ --force
  - git commit -m "Updating build."
```
@highlight 8-18,only

> The `donejs-travis-deploy-to-heroku` generator retrieves data from local configuration files, if any of the values set as default is incorrect, you can enter the correct value when prompted. To find the name of the Heroku application run `heroku apps:info`; or run `heroku auth:token` if you want to see your authentication token.

Next, we set up Travis CI to deploy to [Firebase](https://www.firebase.com/) as well. To automate the deploy to Firebase you need to provide the Firebase CI token. You can get the token by running:

```shell
node_modules/.bin/firebase login:ci
```

In the application folder. It will open a browser window and ask you to authorize the application. Once successful, copy the token and enter it when prompted by the [travis-deploy-to-firebase](https://github.com/donejs/donejs-travis-deploy-to-firebase) generator.

Run the following command:


```shell
donejs add travis-deploy-to-firebase
```

Confirm your GitHub username and application name, then enter the Firebase CI Token from the previous step:

```shell
? What's your GitHub username? <your-username>
? What's your GitHub application name? place-my-order
? What's your Firebase CI Token? <your-firebase-ci-token>
```

And press the Enter key to update the `.travis.yml` file which should now look like this:

```yaml
language: node_js
node_js: node
addons:
  firefox: latest
before_install:
  - 'export DISPLAY=:99.0'
  - sh -e /etc/init.d/xvfb start
deploy:
  skip_cleanup: true
  provider: heroku
  app: <heroku-appname>
  api_key: <encrypted-heroku-api-key>
before_deploy:
  - git config --global user.email "me@example.com"
  - git config --global user.name "deploy bot"
  - node build
  - git add dist/ --force
  - git commit -m "Updating build."
  - 'npm run deploy:ci'
env:
  global:
    - secure: <encrypted-firebase-ci-token>
```
@highlight 19-22,only

Now any time a build succeeds when pushing to `master` the application will be deployed to Heroku and static assets to Firebase's CDN.

To test this out checkout a new branch:

```shell
git checkout -b continuous
git add -A
git commit -m "Trying out continuous deployment"
git push origin continuous
```

Visit your GitHub page, create a pull-request, wait for tests to pass and then merge. Visit your Travis CI build page at [https://travis-ci.org/<your-username>/place-my-order](https://travis-ci.org/<your-username>/place-my-order) to see the deployment happening in real time like this:

![The Travis CI deploy](static/img/guide-travis-deploy.png)

## What's next?

In this final short chapter, let's quickly look at what we did in this guide and where to follow up for any questions.

### Recap

In this in-depth guide we created and deployed a fully tested restaurant menu ordering application called [place-my-order](http://www.place-my-order.com/) with DoneJS. We learned how to set up a DoneJS project, create custom elements and retrieve data from the server. Then we implemented a unit-tested view-model, ran those tests automatically from the command line and on a continuous integration server.

We went into more detail on how to create nested routes and importing other projects from npm. Then we created new orders and made it real-time, added and built documentation and made a production build. Finally we turned that same application into a desktop and mobile application and deployed it to a CDN and the web.

### Following up

You can learn more about each of the individual projects that DoneJS includes at:

- [StealJS](https://stealjs.com) - ES6, CJS, and AMD module loader and builder
- [CanJS](https://canjs.com) - Custom elements and Model-View-ViewModel utilities
- [jQuery](https://jquery.com) - DOM helpers
- [jQuery++](https://jquerypp.com) - Extended DOM helpers
- [QUnit](https://qunitjs.com/) or Mocha - Assertion library
- [FuncUnit](https://funcunit.com) - Functional tests
- [Testee](https://github.com/bitovi/testee) - Test runner
- [DocumentJS](https://documentjs.com) - Documentation

If you have any questions, do not hesitate to ask us on [Slack](https://www.bitovi.com/community/slack) ([#donejs channel](https://bitovi-community.slack.com/messages/CFC80DU5B)) or the [forums](https://forums.bitovi.com)!
