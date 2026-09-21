# Kirana Store — Full Website (React + Express + MongoDB + Cloudinary)

Aapka poora project bana diya hai. Ye ek "MERN-style" app hai:

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (aapki excel file yahi import hogi, uske baad excel file delete kar sakte ho)
- **Images:** Cloudinary (upload backend se hota hai, key/secret kabhi browser me expose nahi hoti)
- **Search:** Sabse important part — neeche detail me samjhaya hai

```
kirana-store/
  server/     -> API + database + import script
  client/     -> React website
```

---

## 1) MongoDB setup

Do options hain:

**A) MongoDB Atlas (free, no install needed — recommended)**
1. https://www.mongodb.com/cloud/atlas/register par free account banao
2. Ek free cluster banao (M0)
3. "Connect" → "Drivers" → connection string copy karo, kuch aisa dikhega:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
4. Network Access me apna IP allow karo (ya 0.0.0.0/0 for testing)

**B) Local MongoDB**
- MongoDB Community Server install karke chalao: `mongodb://127.0.0.1:27017`

---

## 2) Cloudinary setup

1. https://cloudinary.com par free account banao
2. Dashboard par "Account Details" me milega:
   - Cloud Name
   - API Key
   - **API Secret**
3. Ye teeno `server/.env` file me daalne hain.

> Aapke excel me jo images pehle se hain wo bhi `cloudinary.com/mq6c2sfk/...` se hain —
> agar wo aapka hi Cloudinary account hai to same cloud name use karo, purani images
> waise hi chalti rahengi. Naya product add karte time jo image upload karoge wo
> is naye backend ke through same Cloudinary account me jayegi.

---

## 3) Backend setup

```bash
cd server
npm install
cp .env.example .env
```

`.env` file open karke fill karo:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EXCEL_FILE_PATH=./data/products.xlsx
```

Aapki excel file already `server/data/products.xlsx` me daal di gayi hai (sab columns
ke saath — Image, Name, Exact Category, Price, Original Price, Quantity, Sub-Category,
Category, Hindi Name, Hinglish Name, Indian Category, Indian Sub-Category).

### One-time import (excel → MongoDB)

```bash
npm run import
```

Ye script saari ~15,000+ rows MongoDB me daal dega aur search index bana dega.
Terminal me progress dikhega. Jab "Done!" print ho jaye, MongoDB Compass ya
`mongosh` me check kar lo data aa gaya. **Uske baad `server/data/products.xlsx`
delete kar sakte ho** — website ab sirf MongoDB se data leti hai, excel file
kahin use nahi hoti.

### Server start

```bash
npm run dev
```
Server chalega: `http://localhost:5000`

---

## 4) Frontend setup

Naye terminal me:

```bash
cd client
npm install
npm run dev
```
Website khulegi: `http://localhost:5173`

(Vite dev server automatically `/api` requests ko backend port 5000 par bhej deta hai
— `vite.config.js` me proxy already set hai.)

---

## 5) Search — sabse important part

Aapne bola tha search sabse best hona chahiye, to maine ye kiya hai:

1. **MongoDB weighted Text Index (TF-IDF based relevance ranking)** — ye wahi
   algorithm hai jo bade search engines use karte hain (term-frequency scoring).
   `Name` field ko sabse zyada weight diya (10), phir Hinglish/Hindi name (8),
   category (5/4/3)... taaki product-name match hamesha category-match se upar aaye.

2. **Prefix + fuzzy regex layer** — sirf text-index kaafi nahi hota kyunki wo
   partial-word type-ahead (jaise "sharb" type karte hi "Sharbati" dikhna) achhe
   se handle nahi karta. Isliye ek dusra scoring layer bhi laga hai jo prefix-match,
   exact-match aur substring-match ko alag-alag weight deta hai, aur dono results ko
   merge karke best ranking nikalta hai.

3. **Search-as-you-type** — frontend me 250ms debounce + request-cancellation
   (AbortController) hai, taaki type karte hi results turant aaye aur purani
   request nayi ko overwrite na kare.

4. **Hindi + Hinglish dono chalega** — kyunki index me Hindi Name aur Hinglish
   Name columns bhi shaamil hain, "चीनी" ya "cheeni" dono se result milega.

Agar aage aur behtar karna ho (bahut bada catalog ho jaye, jaise lakhon products),
to `MongoDB Atlas Search` (Lucene-based, built-in fuzzy + autocomplete) ya
Algolia/Typesense jaise dedicated search engine me upgrade karna sabse best rahega —
code isi tarah structured hai ki wo swap easy hoga.

### Spelling-mistake tolerant (typo) search

"atta", "aata", "aaata", "attaa" — sab ek hi product tak le jaate hain, kyunki
server start hote hi poora catalog RAM me ek **in-memory search index** ke
roop me load ho jaata hai (`server/services/searchIndex.js`), aur har query
token har field ke against **Levenshtein edit-distance** se compare hota hai
(`server/utils/fuzzy.js`) — yehi algorithm spell-checkers/autocorrect use
karte hain. Match priority: exact > prefix > substring > typo (1-3 edits,
word ki length ke hisaab se).

Ye index automatically refresh hota hai har product add/edit/delete ke baad,
aur har 10 minute me safety-check ke taur par bhi. Agar aapne
`npm run import` se seedhe MongoDB me data daala (server chal rahe hote hue
nahi), to naya data dikhne ke liye ya to:
- server restart kar do (`npm run dev` phir se), ya
- ye endpoint hit kar do: `POST http://localhost:5000/api/products/reindex`

---

## 8) Search karke items add karo aur Excel download karo

Har product card par **"+ Add to list"** button hai. Jitne chaho products
add karo (search karte-karte bhi add kar sakte ho — list bani rehti hai).
Neeche ek floating bar dikhega jisme:
- Kitne items select kiye hain (tap karke poori list expand/collapse hoti hai)
- **"⬇ Download Excel"** button — is par click karte hi ek `.xlsx` file
  download ho jayegi jisme selected products ke saare columns (Image, Name,
  Price, Quantity, Category, Hindi/Hinglish name, etc. — koi bhi custom
  field bhi) present hongi.

List browser me save rehti hai (page refresh karne par bhi nahi jaati),
jab tak "Clear all" na dabao.

---

## 6) Product add karna (with any columns)

"+ Add Product" button click karo:
- Fixed fields (Name, Category, Price, Quantity, etc.) form me hain
- "Custom fields" section me jitne chaho utne extra column add kar sakte ho
  (jaise "Brand", "Expiry Date", "MRP" — kuch bhi), wo bhi save ho jayenge
- Image "Choose Image" se upload karo — seedha Cloudinary par jaata hai

Database ka schema flexible hai (`strict: false`), to koi bhi naya field add karo,
kabhi error nahi aayega aur data loss bhi nahi hoga.

---

## 7) Deploy (jab ready ho)

- **Backend:** Render / Railway / Fly.io par deploy karo, `.env` variables wahan set karo
- **Frontend:** Vercel / Netlify par `client` folder deploy karo, aur
  `client/src/api.js` me baseURL ko apne live backend URL par point karo
  (ya reverse-proxy set karo)
- **MongoDB:** Atlas already cloud-hosted hai, kuch alag se karne ki zaroorat nahi
- **Cloudinary:** already cloud-hosted hai

---

## API endpoints (reference)

| Method | Endpoint | Kaam |
|---|---|---|
| GET | `/api/products?q=&page=&limit=&category=` | Search + list (paginated) |
| GET | `/api/products/suggest?q=` | Fast live-dropdown suggestions |
| GET | `/api/products/meta/categories` | Sab categories (filter pills ke liye) |
| GET | `/api/products/:id` | Ek product |
| POST | `/api/products` | Naya product add (koi bhi fields bhej sakte ho) |
| PUT | `/api/products/:id` | Product update |
| DELETE | `/api/products/:id` | Product delete |
| POST | `/api/upload` | Image upload (Cloudinary) |
