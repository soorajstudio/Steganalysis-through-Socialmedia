import torch
import numpy as np
from torchvision import transforms
from PIL import Image
import sys
import os

# Add Deep-steganalysis to path
CODE_PATH = os.path.join(os.path.dirname(__file__), 'Deep-steganalysis')
if CODE_PATH not in sys.path:
    sys.path.insert(0, CODE_PATH)

import config as c
from models.SRNet import Model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    c.stego_img_channel = 3
    model = Model().to(device)
    model_path = os.path.join(os.path.dirname(__file__), 'best_model_SRNet.pt')
    model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    model.eval()
    print(f"✅ SRNet loaded on {device}")
    return model

srnet_model = load_model()

def check_image(image_path):
    """Returns dict with prediction, cover_prob, stego_prob."""
    transform = transforms.Compose([transforms.ToTensor()])
    img = Image.open(image_path).convert('RGB')
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output     = srnet_model(img_tensor)
        probs      = torch.softmax(output, dim=1)
        prediction = output.data.max(1)[1].item()
        cover_prob = probs[0][0].item() * 100
        stego_prob = probs[0][1].item() * 100

    return {
        "is_stego"  : prediction == 1,
        "cover_prob": round(cover_prob, 2),
        "stego_prob": round(stego_prob, 2),
        "label"     : "STEGO" if prediction == 1 else "COVER"
    }