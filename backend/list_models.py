import google.generativeai as genai

genai.configure(api_key="AIzaSyCIDqfR1m2gHuwxu4lTbD6YqtEbyszq4mE")

models = genai.list_models()
for model in models:
    print(model.name, model.supported_generation_methods)
