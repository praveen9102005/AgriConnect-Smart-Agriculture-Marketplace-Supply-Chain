package com.agrimart.config;

import com.agrimart.entity.*;
import com.agrimart.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           FarmerRepository farmerRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           OrderRepository orderRepository,
                           OrderItemRepository orderItemRepository,
                           DeliveryRepository deliveryRepository,
                           ReviewRepository reviewRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.deliveryRepository = deliveryRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking AgriConnect seed data...");

        // 1. Initialize Users & Farmers
        initUsersAndFarmers();

        // 2. Initialize Categories
        initCategories();

        // 3. Initialize 60+ Agricultural Products
        initProducts();

        // 4. Initialize Orders, Deliveries, and Reviews
        initOrdersAndDeliveries();

        log.info("AgriConnect seed data verification complete!");
    }

    private void initUsersAndFarmers() {
        // Admin
        if (userRepository.findByEmail("admin@agriconnect.com").isEmpty()) {
            User admin = new User("AgriConnect Admin", "admin@agriconnect.com", passwordEncoder.encode("admin123"), Role.ADMIN);
            userRepository.save(admin);
        }

        // Logistics
        if (userRepository.findByEmail("vikram.logistics@agriconnect.com").isEmpty()) {
            User logi1 = new User("Vikram Logistics Express", "vikram.logistics@agriconnect.com", passwordEncoder.encode("logistics123"), Role.LOGISTICS);
            userRepository.save(logi1);
        }
        if (userRepository.findByEmail("deepak.delivery@agriconnect.com").isEmpty()) {
            User logi2 = new User("Deepak AgriTransit", "deepak.delivery@agriconnect.com", passwordEncoder.encode("logistics123"), Role.LOGISTICS);
            userRepository.save(logi2);
        }

        // Customers
        if (userRepository.findByEmail("priya.sharma@gmail.com").isEmpty()) {
            User cust1 = new User("Priya Sharma", "priya.sharma@gmail.com", passwordEncoder.encode("customer123"), Role.CUSTOMER);
            userRepository.save(cust1);
        }
        if (userRepository.findByEmail("arun.kumar@gmail.com").isEmpty()) {
            User cust2 = new User("Arun Kumar", "arun.kumar@gmail.com", passwordEncoder.encode("customer123"), Role.CUSTOMER);
            userRepository.save(cust2);
        }

        // 6 Farmers
        createFarmerIfMissing("Ramesh Patel", "ramesh.patel@agriconnect.com", "Maharashtra", "Nashik Valley", "Organic Vegetables & Vineyards", "+91 98220 11223", 4.9);
        createFarmerIfMissing("Gurpreet Singh", "gurpreet.singh@agriconnect.com", "Punjab", "Ludhiana Plains", "Heritage Basmati & Sharbati Wheat", "+91 98140 22334", 4.9);
        createFarmerIfMissing("Suresh Reddy", "suresh.reddy@agriconnect.com", "Andhra Pradesh", "Guntur Farms", "Authentic Guntur Chillies & Pulses", "+91 98480 33445", 4.8);
        createFarmerIfMissing("Rajesh Sharma", "rajesh.sharma@agriconnect.com", "Himachal Pradesh", "Shimla Apple Orchards", "Royal Delicious Apples & Mountain Honey", "+91 98160 44556", 4.9);
        createFarmerIfMissing("Anand Verma", "anand.verma@agriconnect.com", "Maharashtra", "Ratnagiri Coastal Farms", "GI Tagged Alphonso Mangoes & Cashews", "+91 98200 55667", 5.0);
        createFarmerIfMissing("Manoj Deshmukh", "manoj.deshmukh@agriconnect.com", "Karnataka", "Bijapur Drylands", "Nutri-Cereals, Organic Millets & Cold-pressed Oils", "+91 98450 66778", 4.8);
    }

    private void createFarmerIfMissing(String name, String email, String state, String location, String specialty, String phone, double rating) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User(name, email, passwordEncoder.encode("farmer123"), Role.FARMER);
            return userRepository.save(newUser);
        });

        if (farmerRepository.findByUserId(user.getId()).isEmpty()) {
            Farmer farmer = new Farmer(name, state, location, specialty, phone, email, rating, true, user);
            farmerRepository.save(farmer);
        }
    }

    private void initCategories() {
        String[][] categories = {
                {"Vegetables", "Farm-fresh daily harvested organic vegetables direct from certified growers", "fa-carrot", "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"},
                {"Fruits", "Sun-ripened orchard fresh fruits, GI tagged and naturally cultivated", "fa-apple-alt", "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80"},
                {"Grains", "Premium aged basmati rice, organic wheat and traditional food grains", "fa-wheat-awn", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"},
                {"Millets", "Climate-resilient superfoods: Ragi, Bajra, Jowar and Foxtail Millets", "fa-seedling", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"},
                {"Pulses", "Unpolished protein-rich dal, organic lentils and farm legumes", "fa-bowl-rice", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80"},
                {"Oilseeds", "Pure single-origin mustard, sesame, groundnut and sunflower seeds", "fa-droplet", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"},
                {"Spices", "Hand-plucked aromatic whole spices from Malabar coast and Guntur", "fa-pepper-hot", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"},
                {"Herbs", "Fresh medicinal and culinary herbs: Tulsi, Mint, Lemongrass and Methi", "fa-leaf", "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80"},
                {"Natural Products", "A2 Bilona Desi Ghee, Raw Forest Honey, Cold-pressed Jaggery & Oils", "fa-jar", "https://images.unsplash.com/photo-1589927986086-3d10fb59b703?auto=format&fit=crop&w=600&q=80"},
                {"Dry Fruits", "Sun-dried Himalayan walnuts, Mamra almonds, royal cashews and figs", "fa-cubes-stacked", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"}
        };

        for (String[] cat : categories) {
            if (!categoryRepository.existsByName(cat[0])) {
                Category c = new Category(cat[0], cat[1], cat[2], cat[3]);
                categoryRepository.save(c);
            }
        }
    }

    private void initProducts() {
        if (productRepository.count() >= 60) {
            log.info("Products already seeded (count: {}). Skipping product generation.", productRepository.count());
            return;
        }

        List<Farmer> farmers = farmerRepository.findAll();
        if (farmers.isEmpty()) return;

        Farmer fRamesh = farmers.get(0);
        Farmer fGurpreet = farmers.size() > 1 ? farmers.get(1) : fRamesh;
        Farmer fSuresh = farmers.size() > 2 ? farmers.get(2) : fRamesh;
        Farmer fRajesh = farmers.size() > 3 ? farmers.get(3) : fRamesh;
        Farmer fAnand = farmers.size() > 4 ? farmers.get(4) : fRamesh;
        Farmer fManoj = farmers.size() > 5 ? farmers.get(5) : fRamesh;

        // 60+ Rich Indian Agricultural Products
        Object[][] prodData = {
                // Vegetables (1-10)
                {"Organic Red Vine Tomatoes", "Vegetables", "Naturally ripened, vine-fresh organic red tomatoes full of lycopene and rich tanginess.", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80", 48.0, 60.0, "1 kg", 95, 4.8, 38, "Next Day Delivery", fRamesh},
                {"Pahari Baby Potatoes", "Vegetables", "Directly harvested firm Pahari potatoes, ideal for roasting, curries and dum aloo.", "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80", 42.0, 50.0, "1 kg", 120, 4.7, 24, "Next Day Delivery", fRamesh},
                {"Nashik Red Onions", "Vegetables", "Pungent, high-dry-matter red onions from Nashik farms with long shelf life.", "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80", 55.0, 68.0, "1 kg", 140, 4.9, 45, "Same Day Available", fRamesh},
                {"Sweet Winter Carrots", "Vegetables", "Crunchy red winter carrots cultivated without chemical fertilizers, naturally sweet.", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80", 65.0, 80.0, "1 kg", 85, 4.8, 19, "Next Day Delivery", fRamesh},
                {"Crisp Organic Cabbage", "Vegetables", "Dense, crisp heads of field cabbage grown using Jeevamrutha bio-fertilizers.", "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80", 38.0, 45.0, "1 head (~800g)", 60, 4.6, 15, "Standard (2 days)", fRamesh},
                {"Snow White Cauliflower", "Vegetables", "Freshly cut snow-white florets, insect-mesh protected and pesticide free.", "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80", 50.0, 62.0, "1 head", 55, 4.7, 21, "Standard (2 days)", fRamesh},
                {"Tender Baby Spinach (Palak)", "Vegetables", "Hydro-washed baby spinach leaves harvested at daybreak for peak vitamin freshness.", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80", 35.0, 45.0, "250 g bunch", 45, 4.9, 32, "Same Day Harvest", fRamesh},
                {"Sweet Green Peas (Matar)", "Vegetables", "Tender sweet pods packed with lush green peas straight from Himachal foothill farms.", "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80", 80.0, 95.0, "1 kg", 70, 4.8, 29, "Next Day Delivery", fRajesh},
                {"Tricolor Bell Peppers", "Vegetables", "Greenhouse grown red, yellow and green bell peppers with crisp juicy walls.", "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80", 120.0, 150.0, "500 g pack", 40, 4.7, 18, "Express Cold Chain", fRamesh},
                {"Purple Baingan (Eggplant)", "Vegetables", "Glossy purple tender brinjals ideal for authentic Baingan Bharta and curries.", "https://images.unsplash.com/photo-1605291535248-cf9b0c2621cb?auto=format&fit=crop&w=600&q=80", 40.0, 52.0, "1 kg", 65, 4.6, 12, "Next Day Delivery", fRamesh},

                // Fruits (11-20)
                {"GI Tagged Ratnagiri Alphonso Mango", "Fruits", "Authentic Devgad & Ratnagiri Hapus mangoes with unmatched saffron aroma and buttery pulp.", "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80", 1150.0, 1400.0, "1 Dozen (Box)", 40, 5.0, 89, "Temperature Controlled", fAnand},
                {"Nagpur Juicy Oranges", "Fruits", "Famous Vidarbha mandarin oranges bursting with vitamin C and refreshing sweet juice.", "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80", 110.0, 135.0, "1 kg", 90, 4.8, 34, "Next Day Delivery", fAnand},
                {"Kinnaur Royal Delicious Apples", "Fruits", "High-altitude Kinnaur apples with distinct ruby skin, crunchy bite and aromatic sweetness.", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80", 190.0, 230.0, "1 kg", 75, 4.9, 58, "Cold Chain Transit", fRajesh},
                {"Robusta Organic Bananas", "Fruits", "Naturally tree-ripened pesticide-free bananas from Cauvery delta basin.", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80", 55.0, 70.0, "1 kg (~6 pcs)", 110, 4.7, 22, "Same Day Harvest", fSuresh},
                {"Allahabad Safeda Guava", "Fruits", "Velvety white pulp guavas with gentle sweetness and rich dietary fiber.", "https://images.unsplash.com/photo-1536511135899-73b318c64495?auto=format&fit=crop&w=600&q=80", 85.0, 105.0, "1 kg", 60, 4.8, 16, "Standard (2 days)", fRajesh},
                {"Solapur Bhagwa Pomegranate", "Fruits", "Deep crimson pearls packed with antioxidants, juicy sweet arils and soft seeds.", "https://images.unsplash.com/photo-1550989460-0adc9f6e3a6c?auto=format&fit=crop&w=600&q=80", 180.0, 220.0, "1 kg (4 pcs)", 80, 4.9, 41, "Express Cold Chain", fRamesh},
                {"Red Lady Farm Papaya", "Fruits", "Sun-kissed red-orange flesh papaya, smooth texture and low acidity.", "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80", 60.0, 75.0, "1 pc (~1.2 kg)", 50, 4.6, 14, "Standard (2 days)", fSuresh},
                {"Nashik Seedless Green Grapes", "Fruits", "Export-grade crunchy green Thompson seedless grapes, naturally sweet and crisp.", "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80", 125.0, 150.0, "500 g punnet", 70, 4.9, 53, "Express Cold Chain", fRamesh},
                {"Deccan Custard Apple (Sitaphal)", "Fruits", "Creamy, sugar-rich heirloom Sitaphal harvested carefully by hand.", "https://images.unsplash.com/photo-1590005354167-6da97870c757?auto=format&fit=crop&w=600&q=80", 140.0, 175.0, "1 kg", 35, 4.8, 19, "Special Fruit Transit", fManoj},
                {"Mosambi Sweet Lime", "Fruits", "Juice-packed fresh Mosambi, refreshing citrus profile with zero bitterness.", "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80", 95.0, 120.0, "1 kg", 85, 4.7, 26, "Next Day Delivery", fAnand},

                // Grains (21-28)
                {"Traditional 1121 Basmati Rice", "Grains", "2-year aged extra long grain basmati rice, cooks up to 24mm fluffiness with royal fragrance.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", 165.0, 195.0, "1 kg", 200, 4.9, 72, "Standard (2-3 days)", fGurpreet},
                {"Andhra Sona Masoori Rice", "Grains", "Aromatic medium-grain lightweight unpolished rice, staple everyday healthy grain.", "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80", 78.0, 92.0, "1 kg", 180, 4.8, 48, "Standard (2-3 days)", fSuresh},
                {"Madhya Pradesh Sharbati Wheat", "Grains", "Heavy golden grains of prime Sharbati wheat, makes exceptionally soft golden rotis.", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80", 62.0, 75.0, "1 kg", 250, 4.9, 64, "Standard (2-3 days)", fGurpreet},
                {"Durum Samba Wheat Grains", "Grains", "Hard amber durum wheat, rich in carotenoids and protein, excellent for dalia and pasta.", "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80", 68.0, 80.0, "1 kg", 150, 4.7, 21, "Standard (2-3 days)", fGurpreet},
                {"Natural Yellow Maize Corn", "Grains", "Sundried non-GMO whole yellow corn kernels, rich in fiber and zeaxanthin.", "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80", 48.0, 60.0, "1 kg", 120, 4.6, 17, "Standard (2-3 days)", fManoj},
                {"Hulled Barley Grains (Jau)", "Grains", "Cooling dietary fiber powerhouse, traditionally stone-hulled to preserve germ and bran.", "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80", 75.0, 90.0, "1 kg", 110, 4.8, 23, "Standard (2-3 days)", fGurpreet},
                {"Red Rice from Wayanad", "Grains", "Heritage antioxidant-rich unpolished red rice loaded with iron and zinc.", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80", 110.0, 135.0, "1 kg", 90, 4.8, 31, "Standard (2-3 days)", fManoj},
                {"Black Forbidden Rice", "Grains", "Organic heirloom black rice with deep anthocyanin purple pigment and nutty taste.", "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80", 220.0, 260.0, "500 g", 65, 4.9, 39, "Standard (2-3 days)", fManoj},

                // Millets (29-35)
                {"Organic Finger Millet (Ragi)", "Millets", "Calcium-dense ancient red ragi grains, dry-farmed without borewell depletion.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", 65.0, 80.0, "1 kg", 170, 4.9, 56, "Standard (2-3 days)", fManoj},
                {"Pearl Millet (Bajra)", "Millets", "Warming, iron-loaded whole pearl millet grains grown in Rajasthan and Karnataka borders.", "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80", 52.0, 65.0, "1 kg", 140, 4.7, 28, "Standard (2-3 days)", fManoj},
                {"Sorghum Grains (Jowar)", "Millets", "Gluten-free white jowar grain, perfect for wholesome diabetic-friendly bhakri.", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80", 58.0, 72.0, "1 kg", 160, 4.8, 33, "Standard (2-3 days)", fManoj},
                {"Foxtail Millet (Kangni)", "Millets", "De-hulled raw golden foxtail millet, high in dietary fiber and slow-release carbs.", "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80", 95.0, 115.0, "1 kg", 120, 4.9, 44, "Standard (2-3 days)", fManoj},
                {"Little Millet (Kutki)", "Millets", "Small grain super-millet with light cooking profile, great rice substitute.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", 98.0, 120.0, "1 kg", 95, 4.8, 22, "Standard (2-3 days)", fManoj},
                {"Barnyard Millet (Sanwa)", "Millets", "Fast cooking, light on stomach, traditional fasting and wellness grain.", "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80", 105.0, 130.0, "1 kg", 85, 4.8, 27, "Standard (2-3 days)", fManoj},
                {"Kodo Millet (Varagu)", "Millets", "Ancient low-glycemic grain rich in polyphenols and antioxidants.", "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80", 96.0, 118.0, "1 kg", 90, 4.7, 19, "Standard (2-3 days)", fManoj},

                // Pulses (36-42)
                {"Unpolished Desi Toor Dal", "Pulses", "Raw unpolished pigeon pea split dal with natural sheen and maximum protein retention.", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80", 175.0, 210.0, "1 kg", 150, 4.9, 81, "Standard (2-3 days)", fSuresh},
                {"Organic Moong Dal Split", "Pulses", "Easily digestible yellow split moong, no synthetic colors or oils used in milling.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", 145.0, 175.0, "1 kg", 130, 4.8, 42, "Standard (2-3 days)", fSuresh},
                {"Whole Black Urad Dal", "Pulses", "High-protein black gram pulse, foundational for rich Dal Makhani and south Indian batters.", "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80", 155.0, 185.0, "1 kg", 110, 4.8, 37, "Standard (2-3 days)", fSuresh},
                {"Chana Dal Desi", "Pulses", "Naturally split Bengal gram pulse with nutty aroma and high soluble fiber.", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80", 110.0, 130.0, "1 kg", 140, 4.7, 30, "Standard (2-3 days)", fSuresh},
                {"Red Masoor Dal", "Pulses", "Quick cooking orange-red lentils, excellent for daily comforting dal recipes.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80", 125.0, 150.0, "1 kg", 125, 4.8, 25, "Standard (2-3 days)", fSuresh},
                {"Kabuli Jumbo Chana", "Pulses", "Large grain tender white chickpeas, perfect for mouthwatering Chana Masala.", "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80", 160.0, 190.0, "1 kg", 100, 4.9, 49, "Standard (2-3 days)", fGurpreet},
                {"Brown Desi Kala Chana", "Pulses", "Dense, protein-packed small brown chickpeas, supreme for sprouting and curries.", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80", 95.0, 115.0, "1 kg", 130, 4.8, 28, "Standard (2-3 days)", fSuresh},

                // Oilseeds (43-48)
                {"Yellow Mustard Seeds (Sarson)", "Oilseeds", "Pungent golden yellow sarson seeds for traditional tempering and cold pressing.", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", 130.0, 155.0, "500 g", 90, 4.8, 31, "Standard (2-3 days)", fGurpreet},
                {"Raw Bold Groundnut Peanuts", "Oilseeds", "Plump sweet kernels from Saurashtra red soil, sun-dried without mold risk.", "https://images.unsplash.com/photo-1567892328127-d0d57e0fa0c1?auto=format&fit=crop&w=600&q=80", 160.0, 190.0, "1 kg", 120, 4.9, 52, "Standard (2-3 days)", fRamesh},
                {"White Sesame Seeds (Til)", "Oilseeds", "Clean calcium-rich raw sesame seeds, ideal for winter sweets and tahini.", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", 180.0, 220.0, "500 g", 80, 4.8, 24, "Standard (2-3 days)", fManoj},
                {"Sunflower Seeds Kernel", "Oilseeds", "Raw unsalted sunflower kernels, rich in Vitamin E and magnesium.", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", 195.0, 240.0, "500 g", 70, 4.7, 18, "Standard (2-3 days)", fManoj},
                {"Organic Brown Flax Seeds (Alsi)", "Oilseeds", "Plant-based Omega-3 powerhouse seeds, stone-cleaned and ready for roasting.", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", 110.0, 135.0, "500 g", 115, 4.9, 43, "Standard (2-3 days)", fManoj},
                {"Organic Black Chia Seeds", "Oilseeds", "Hydrophilic fiber-packed chia seeds, certified non-GMO and residue-free.", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", 250.0, 310.0, "500 g", 60, 4.9, 39, "Standard (2-3 days)", fManoj},

                // Spices (49-54)
                {"Wayanad Malabar Black Pepper", "Spices", "Tellicherry grade extra bold black peppercorns with intense volatile oil content.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80", 420.0, 500.0, "250 g", 85, 5.0, 67, "Standard (2-3 days)", fSuresh},
                {"Salem Golden Turmeric Finger", "Spices", "High-curcumin (5%+) pure Salem turmeric rhizomes, polished with natural cloth.", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80", 190.0, 230.0, "500 g", 105, 4.9, 58, "Standard (2-3 days)", fSuresh},
                {"Guntur Sannam Red Chilli", "Spices", "Sun-dried whole stemless Guntur chillies, vibrant red color and fiery heat.", "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80", 160.0, 195.0, "500 g", 120, 4.8, 46, "Standard (2-3 days)", fSuresh},
                {"Idukki Green Cardamom 8mm+", "Spices", "Jumbo aromatic cardamom pods harvested from Kerala cloud forests.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80", 750.0, 900.0, "100 g", 75, 4.9, 62, "Express Transit", fSuresh},
                {"Unpolished Cumin Seeds (Jeera)", "Spices", "Earthy high-essential-oil cumin from Gujarat-Rajasthan spice belt.", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80", 240.0, 290.0, "500 g", 95, 4.8, 35, "Standard (2-3 days)", fRamesh},
                {"Madagascar Hand-Picked Cloves", "Spices", "Head-intact aromatic whole cloves with rich clove oil content.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80", 310.0, 370.0, "100 g", 80, 4.9, 29, "Standard (2-3 days)", fSuresh},

                // Herbs (55-58)
                {"Fresh Krishna Tulsi Leaves", "Herbs", "Sacred holy basil leaves plucked daily for herbal teas and immune vitality.", "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80", 40.0, 50.0, "100 g bunch", 50, 4.9, 44, "Same Day Harvest", fRajesh},
                {"Crisp Organic Mint (Pudina)", "Herbs", "Invigorating field mint with intense aroma, fresh green leaves and clean roots.", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80", 25.0, 35.0, "150 g bunch", 60, 4.8, 22, "Same Day Harvest", fRamesh},
                {"Fresh Lemon Grass Stalks", "Herbs", "Citrusy fragrant lemongrass stalks, freshly clipped for authentic herbal infusions.", "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80", 45.0, 60.0, "200 g pack", 40, 4.7, 15, "Standard (2 days)", fRajesh},
                {"Mountain Rosemary Sprigs", "Herbs", "Cold-climate evergreen rosemary sprigs, rich in aromatic pinene and antioxidants.", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80", 60.0, 75.0, "100 g pack", 35, 4.8, 18, "Next Day Delivery", fRajesh},

                // Natural Products (59-62)
                {"Desi Gir Cow A2 Bilona Ghee", "Natural Products", "Hand-churned curd bilona ghee from free-grazing Gir cows in bronze containers.", "https://images.unsplash.com/photo-1589927986086-3d10fb59b703?auto=format&fit=crop&w=600&q=80", 1450.0, 1750.0, "500 ml glass jar", 45, 5.0, 114, "Protected Glass Pack", fRamesh},
                {"Raw Wild Forest Honey", "Natural Products", "Unfiltered raw multi-flora honey collected by tribal foragers from Jim Corbett foothills.", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80", 480.0, 580.0, "500 g jar", 65, 4.9, 78, "Standard (2-3 days)", fRajesh},
                {"Cold-Pressed Sugarcane Jaggery", "Natural Products", "Chemical-free solid jaggery block prepared using okra mucilage clarification.", "https://images.unsplash.com/photo-1589927986086-3d10fb59b703?auto=format&fit=crop&w=600&q=80", 110.0, 140.0, "1 kg block", 95, 4.8, 38, "Standard (2-3 days)", fRamesh},
                {"Wood-Pressed Virgin Coconut Oil", "Natural Products", "Cold-extracted from fresh coastal Malabar coconuts without heat degradation.", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80", 380.0, 450.0, "500 ml bottle", 70, 4.9, 56, "Standard (2-3 days)", fAnand},

                // Dry Fruits (63-66)
                {"Kashmir Snow Walnuts In-Shell", "Dry Fruits", "Paper-shell natural organic walnuts from Sopore Kashmir, easily cracked by hand.", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", 540.0, 650.0, "500 g pack", 55, 4.9, 63, "Standard (2-3 days)", fRajesh},
                {"Original Mamra Almonds", "Dry Fruits", "Oil-rich indigenous Mamra almonds from Kashmir, maximum vitamin E and natural sweet oils.", "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80", 980.0, 1200.0, "500 g pouch", 50, 5.0, 84, "Standard (2-3 days)", fRajesh},
                {"Royal Cashew Nuts (W240)", "Dry Fruits", "Jumbo whole white cashews direct from Konkan orchards, sweet and buttery.", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", 620.0, 750.0, "500 g pack", 60, 4.9, 52, "Standard (2-3 days)", fAnand},
                {"Organic Sun-Dried Figs (Anjeer)", "Dry Fruits", "Naturally dried soft seed-rich figs from Purandar valley, zero sulfur treatment.", "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80", 490.0, 600.0, "500 g garland", 45, 4.8, 37, "Standard (2-3 days)", fRamesh}
        };

        for (Object[] data : prodData) {
            Product p = new Product(
                    (String) data[0],
                    (String) data[1],
                    (String) data[2],
                    (String) data[3],
                    (Double) data[4],
                    (Double) data[5],
                    (String) data[6],
                    (Integer) data[7],
                    (Double) data[8],
                    (Integer) data[9],
                    (String) data[10],
                    (Farmer) data[11]
            );
            productRepository.save(p);
        }
        log.info("Successfully seeded {} agricultural products!", prodData.length);
    }

    private void initOrdersAndDeliveries() {
        if (orderRepository.count() > 0) {
            return;
        }

        User customer = userRepository.findByEmail("priya.sharma@gmail.com").orElse(null);
        if (customer == null) return;

        List<Product> products = productRepository.findAll();
        if (products.size() < 10) return;

        // Sample Order 1: DELIVERED
        Order o1 = new Order(customer, "Priya Sharma", "Flat 402, Green Acres, Powai, Mumbai - 400076", BigDecimal.valueOf(1740.00), OrderStatus.DELIVERED);
        o1.setCreatedAt(LocalDateTime.now().minusDays(4));
        orderRepository.save(o1);

        OrderItem oi1 = new OrderItem(o1, products.get(0), products.get(0).getName(), 2, products.get(0).getPrice(), products.get(0).getFarmer().getId());
        OrderItem oi2 = new OrderItem(o1, products.get(10), products.get(10).getName(), 1, products.get(10).getPrice(), products.get(10).getFarmer().getId());
        orderItemRepository.saveAll(List.of(oi1, oi2));

        Delivery d1 = new Delivery(o1.getId(), "Vikram Deshmukh", "MH-04-AZ-9102 (Refrigerated Truck)", "Nashik Valley Hub", o1.getDeliveryAddress(), 19.1176, 72.9060, "Delivered", OrderStatus.DELIVERED.name());
        d1.setUpdatedAt(LocalDateTime.now().minusDays(3));
        deliveryRepository.save(d1);

        // Sample Order 2: IN_TRANSIT
        Order o2 = new Order(customer, "Priya Sharma", "Flat 402, Green Acres, Powai, Mumbai - 400076", BigDecimal.valueOf(1615.00), OrderStatus.IN_TRANSIT);
        o2.setCreatedAt(LocalDateTime.now().minusHours(18));
        orderRepository.save(o2);

        OrderItem oi3 = new OrderItem(o2, products.get(20), products.get(20).getName(), 3, products.get(20).getPrice(), products.get(20).getFarmer().getId());
        OrderItem oi4 = new OrderItem(o2, products.get(35), products.get(35).getName(), 2, products.get(35).getPrice(), products.get(35).getFarmer().getId());
        orderItemRepository.saveAll(List.of(oi3, oi4));

        Delivery d2 = new Delivery(o2.getId(), "Sanjay Patil", "MH-12-CD-5544 (Cold Chain Van)", "Ludhiana Logistics Depot", o2.getDeliveryAddress(), 19.3919, 73.1255, "Arriving in 3 hours", OrderStatus.IN_TRANSIT.name());
        deliveryRepository.save(d2);

        // Sample Order 3: OUT_FOR_DELIVERY
        Order o3 = new Order(customer, "Priya Sharma", "Flat 402, Green Acres, Powai, Mumbai - 400076", BigDecimal.valueOf(870.00), OrderStatus.OUT_FOR_DELIVERY);
        o3.setCreatedAt(LocalDateTime.now().minusHours(8));
        orderRepository.save(o3);

        OrderItem oi5 = new OrderItem(o3, products.get(2), products.get(2).getName(), 4, products.get(2).getPrice(), products.get(2).getFarmer().getId());
        OrderItem oi6 = new OrderItem(o3, products.get(6), products.get(6).getName(), 3, products.get(6).getPrice(), products.get(6).getFarmer().getId());
        orderItemRepository.saveAll(List.of(oi5, oi6));

        Delivery d3 = new Delivery(o3.getId(), "Deepak Verma", "MH-01-EE-3211 (AgriEV Van)", "Bhiwandi Central Agro Sorting Center", o3.getDeliveryAddress(), 19.0760, 72.8777, "Arriving in 45 mins", OrderStatus.OUT_FOR_DELIVERY.name());
        deliveryRepository.save(d3);

        // Sample Review
        Review r1 = new Review(products.get(10), customer, "Priya Sharma", 5.0, "The Alphonso mangoes arrived in peak condition with royal fragrance! Pure farm freshness.");
        reviewRepository.save(r1);

        Review r2 = new Review(products.get(0), customer, "Priya Sharma", 4.9, "Extremely fresh vine tomatoes, firm and vibrant with zero transit bruising.");
        reviewRepository.save(r2);
    }
}
