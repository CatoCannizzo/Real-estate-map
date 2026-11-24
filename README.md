# Interactive Real Estate Map 🏡

This project is being built by [Cato Cannizzo](https://github.com/CatoCannizzo) as part of the 8-week real estate mapping micro-internship led by [@wwwaiser](https://github.com/wwwaiser) ([project details repo](https://github.com/wwwaiser/real-estate-map-project)).

The goal is to build an interactive, map-first real estate web application. It integrates a mapbox tile vector/geojson for parcel polygon shapes, graphql calls for parcel details, and google static street view api for photos.

Currently hosted with vercel [here](https://real-estate-map-snowy.vercel.app/).
![Image of landing page of 'interactive map' with a parcel selected. The map has properties shaded by year built with new builds being a stronger hue of purple. On the side bar it shows property details including address, sq ft, sales history, and images.](image.png)

## Set up

To run this project you will need to download the repo and get a mapbox-gl api key and, optionally, a google maps api key with static street view api turned on.
These should be stored in a .env.local labeled as 'NEXT_PUBLIC_MAPBOX_TOKEN' and 'NEXT_PUBLIC_GOOGLE_MAPS_KEY' respectively.

- Build app:
  - `npm install` installs project dependencies
  - `npm run lint` runs eslint
  - `npm run codegen` runs graphql-codegen to generate GraphQL types
  - `npm run dev` runs the local development server
  - `npm run build` builds the production application
  - `npm run start` starts the production server locally

- Run the test suite:
  - `npm test` runs vitest run
  - `npm run test:watch` runs vitest in watch mode for development

run `npm run dev` - runs local deployment

### Frontend & UI

- **Next.js**, **React** - Manages state and promises. Use extensively to ensure each component loads and dismounts correctly.
  - Use Memo was critical for storing transformed graphQL data in many of my use-gql-\*\*\* hooks.
  - useSyncExternalStore enabled me to parse query parameters from the url `?id=` without redundant react component rerenders.
  - useEffect and useRef throughout the app for component life cycles.
- **TypeScript** - Manages type casting during development and ensured my expected returns where what I expected returned. Critical for readability, and understanding code especially in an age where llms can handle all the boiler plate interface creation.
- **Tailwind CSS**, **shadcn/ui**, **Lucide Icons**, & **Sonner** - Makes my UI look pretty and keeps it A11y accessible. Sonner is my hands down favorite notification library.

### Mapping & APIs

- **Mapbox GL** (via `react-map-gl`)
  - The workhorse of this project. It draws the canvas and keeps track of map items. All of its layer states where stored in 'feature-state' to optimize performance while enabling react to pass new data to the map.
  - Primary orchestration is handled in `propertyexplorer.tsx` where all state is kept track of and passed down to the components that need them.
  - `property-polygons.tsx` is the primary receiver of the data from the app, when using vector tile sets it streams the polygon data directly to Mapbox telling it how to load and display the polygon layers.
  - `property-sidebar.tsx` is the primary display for the data of individual polygons and also interfaces with the google static street view API to display pictures, through `user-street-view-images.ts`.
- **GraphQL** & **Apollo Client** - Handles the fetching of parcel meta data in clean and concise api calls. GraphQL only grabs the data I need keep and is seemingly infinitely customizable in how I rearrange what I call.
- **Google Static Street View API** - Called to get photos of a given property.

### Testing & Tooling

- **GraphQL Code Generator** - To programmatically generate the typescript types and query documents directly from the graphQL schema, again very useful for debugging any app.
- **Vitest** & **React Testing Library** - Testing library, although I test the boundary of mapbox for some integration tests (in `mapbox.test.ts`), this project suffers from not being able to actually render the WebGL of the Mapbox GL canvas without a slow and intensive test suite like playwrite. Which is outside my intent for this project. Additionally most tests in this project are written via LLM, with myself just prompting the llm to cover certain edge cases when missed. (Mostly race conditions on API calls, or when loading the app from a slugged url.)
- **ESLint**

### Deployment

- **Vercel** @ https://real-estate-map-snowy.vercel.app/
