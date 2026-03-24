const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    images: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: ['Classic', 'Super Treasure Hunt', 'Racing', 'Fantasy', 'Licensed', 'Monster Trucks', 'Track Sets', 'Limited Edition'],
    },
    brand: { type: String, default: 'Hot Wheels' },
    series: { type: String, default: '' },
    year: { type: Number },
    scale: { type: String, default: '1:64' },
    color: { type: String, default: '' },
    stockCount: { type: Number, required: true, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
