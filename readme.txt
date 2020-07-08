# Development overview
App served locally for development is served from backend and has live reload.

# Serving locally for development
To run app locally for development:
1. install mongodb
2. run mongodb instance with --dbpath flag set to "<project_path>/db/testing"
3. in backend folder run `npm run start`
4. in frontend folder run `npm run build:dev`
App is available under localhost:6040 address

# About testing and prod databases
- testing databes has no significant information in it and can be freely altered. It's recomended to work on new functionallities on this db
- prod db is used as storage for usefull data and should be used only with stable versions of app