mode = 'train' # train or test

epochs = 50
# optimizer: Adam 
lr = 2e-4
weight_decay = 1e-5
gamma = 0.5
weight_decay_step = 30

train_batch_size = 4
val_batch_size = 4
test_batch_size = 4
save_freq = 1
val_freq = 1
strat_save_epoch = 1

# Path settings
train_data_dir = 'train_data_dir'
val_data_dir = 'val_data_dir' 
test_data_dir = 'test_data_dir' 

# Matching BOSSbase-256 specs
stego_img_height = 256 
stego_img_width = 256
stego_img_channel = 1
