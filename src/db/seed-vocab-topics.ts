import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

interface WordItem {
  word: string;
  partOfSpeech: string;
  meaning: string;
  pronunciation: string;
  synonyms: string[];
}

interface TopicData {
  name: string;
  slug: string;
  description: string;
  stageId: string;
  words: WordItem[];
}

const TOPICS_DATA: TopicData[] = [
  // ==========================================
  // STAGE 1: NỀN TẢNG KHỞI ĐỘNG (BAND 3.5 - 4.5)
  // ==========================================
  {
    name: "Đời sống hàng ngày (Daily Life)",
    slug: "doi-song-hang-ngay",
    description: "Vốn từ quen thuộc về thói quen sinh hoạt, thời gian rảnh rỗi và nếp sống gia đình.",
    stageId: "stage-vocab-1",
    words: [
      { word: "routine", partOfSpeech: "noun", meaning: "thói quen sinh hoạt hàng ngày", pronunciation: "/ruːˈtiːn/", synonyms: ["habit", "schedule"] },
      { word: "leisure", partOfSpeech: "noun", meaning: "thời gian rảnh rỗi, giải trí", pronunciation: "/ˈleʒ.ər/", synonyms: ["free time", "recreation"] },
      { word: "domestic", partOfSpeech: "adjective", meaning: "thuộc về gia đình, nội trợ", pronunciation: "/dəˈmes.tɪk/", synonyms: ["household", "familial"] },
      { word: "commute", partOfSpeech: "verb", meaning: "đi lại thường xuyên giữa nhà và nơi làm việc", pronunciation: "/kəˈmjuːt/", synonyms: ["travel", "journey"] },
      { word: "chore", partOfSpeech: "noun", meaning: "việc vặt trong nhà (nấu nướng, dọn dẹp)", pronunciation: "/tʃɔːr/", synonyms: ["housework", "task"] },
      { word: "nutrition", partOfSpeech: "noun", meaning: "chế độ dinh dưỡng cho sức khỏe", pronunciation: "/njuːˈtrɪʃ.n/", synonyms: ["nourishment", "diet"] },
      { word: "hygiene", partOfSpeech: "noun", meaning: "vệ sinh cá nhân và nơi ở", pronunciation: "/ˈhaɪ.dʒiːn/", synonyms: ["cleanliness", "sanitation"] },
      { word: "affordable", partOfSpeech: "adjective", meaning: "giá cả phải chăng, vừa túi tiền", pronunciation: "/əˈfɔː.də.bəl/", synonyms: ["economical", "reasonable"] },
      { word: "convenient", partOfSpeech: "adjective", meaning: "tiện lợi, thuận tiện cho sinh hoạt", pronunciation: "/kənˈviː.ni.ənt/", synonyms: ["handy", "practical"] },
      { word: "habit", partOfSpeech: "noun", meaning: "thói quen cá nhân hình thành lâu dài", pronunciation: "/ˈhæb.ɪt/", synonyms: ["practice", "custom"] },
    ],
  },
  {
    name: "Gia đình & Mối quan hệ (Family & Relationships)",
    slug: "gia-dinh-moi-quan-he",
    description: "Từ vựng về quan hệ ruột thịt, sự nuôi dạy con cái và gắn kết tình cảm.",
    stageId: "stage-vocab-1",
    words: [
      { word: "sibling", partOfSpeech: "noun", meaning: "anh chị em ruột trong gia đình", pronunciation: "/ˈsɪb.lɪŋ/", synonyms: ["brother or sister"] },
      { word: "upbringing", partOfSpeech: "noun", meaning: "sự nuôi nấng và dạy dỗ từ thuở nhỏ", pronunciation: "/ˈʌpˌbrɪŋ.ɪŋ/", synonyms: ["raising", "rearing"] },
      { word: "bond", partOfSpeech: "noun", meaning: "sợi dây liên kết, mối quan hệ gắn bó", pronunciation: "/bɒnd/", synonyms: ["connection", "tie"] },
      { word: "relative", partOfSpeech: "noun", meaning: "người họ hàng, bà con thân thuộc", pronunciation: "/ˈrel.ə.tɪv/", synonyms: ["family member", "kin"] },
      { word: "guardian", partOfSpeech: "noun", meaning: "người giám hộ, bảo trợ hợp pháp", pronunciation: "/ˈɡɑː.di.ən/", synonyms: ["protector", "custodian"] },
      { word: "intimacy", partOfSpeech: "noun", meaning: "sự thân mật, gần gũi chân thành", pronunciation: "/ˈɪn.tɪ.mə.si/", synonyms: ["closeness", "affection"] },
      { word: "conflict", partOfSpeech: "noun", meaning: "sự mâu thuẫn, tranh cãi bất đồng", pronunciation: "/ˈkɒn.flɪkt/", synonyms: ["dispute", "disagreement"] },
      { word: "parental", partOfSpeech: "adjective", meaning: "thuộc về trách nhiệm của cha mẹ", pronunciation: "/pəˈren.təl/", synonyms: ["maternal", "paternal"] },
      { word: "household", partOfSpeech: "noun", meaning: "hộ gia đình cùng chung sống", pronunciation: "/ˈhaʊs.həʊld/", synonyms: ["family unit", "home"] },
      { word: "nurture", partOfSpeech: "verb", meaning: "chăm sóc, nuôi dưỡng tình cảm", pronunciation: "/ˈnɜː.tʃər/", synonyms: ["foster", "cherish"] },
    ],
  },
  {
    name: "Trường học & Học tập (School & Study)",
    slug: "truong-hoc-hoc-tap",
    description: "Từ vựng cơ bản về môi trường giảng đường, bài tập và tính chuyên cần.",
    stageId: "stage-vocab-1",
    words: [
      { word: "curriculum", partOfSpeech: "noun", meaning: "chương trình khung giảng dạy của nhà trường", pronunciation: "/kəˈrɪk.jə.ləm/", synonyms: ["syllabus", "course"] },
      { word: "assignment", partOfSpeech: "noun", meaning: "bài tập hoặc nhiệm vụ được giao về nhà", pronunciation: "/əˈsaɪn.mənt/", synonyms: ["homework", "project"] },
      { word: "discipline", partOfSpeech: "noun", meaning: "tính kỷ luật, sự rèn giũa nền nếp", pronunciation: "/ˈdɪs.ə.plɪn/", synonyms: ["self-control", "order"] },
      { word: "peer", partOfSpeech: "noun", meaning: "bạn cùng trang lứa, bạn cùng lớp", pronunciation: "/pɪər/", synonyms: ["classmate", "contemporary"] },
      { word: "concentrate", partOfSpeech: "verb", meaning: "tập trung cao độ vào bài học", pronunciation: "/ˈkɒn.sən.treɪt/", synonyms: ["focus", "pay attention"] },
      { word: "tutor", partOfSpeech: "noun", meaning: "gia sư, trợ giảng hướng dẫn học viên", pronunciation: "/ˈtjuː.tər/", synonyms: ["instructor", "coach"] },
      { word: "evaluate", partOfSpeech: "verb", meaning: "đánh giá kết quả học tập", pronunciation: "/ɪˈvæl.ju.eɪt/", synonyms: ["assess", "appraise"] },
      { word: "diploma", partOfSpeech: "noun", meaning: "văn bằng tốt nghiệp", pronunciation: "/dɪˈpləʊ.mə/", synonyms: ["certificate", "degree"] },
      { word: "attendance", partOfSpeech: "noun", meaning: "sự chuyên cần, việc điểm danh có mặt", pronunciation: "/əˈten.dəns/", synonyms: ["presence", "participation"] },
      { word: "academic", partOfSpeech: "adjective", meaning: "mang tính chất học thuật, trường lớp", pronunciation: "/ˌæk.əˈdem.ɪk/", synonyms: ["scholarly", "educational"] },
    ],
  },
  {
    name: "Sức khỏe & Rèn luyện (Health & Fitness)",
    slug: "suc-khoe-ren-luyen",
    description: "Các thuật ngữ về lối sống lành mạnh, bài tập thể chất và chế độ sinh hoạt.",
    stageId: "stage-vocab-1",
    words: [
      { word: "sedentary", partOfSpeech: "adjective", meaning: "ít vận động, ngồi một chỗ nhiều giờ", pronunciation: "/ˈsed.ən.tər.i/", synonyms: ["inactive", "desk-bound"] },
      { word: "fitness", partOfSpeech: "noun", meaning: "thể lực, sự khỏe khoắn của cơ thể", pronunciation: "/ˈfɪt.nəs/", synonyms: ["health", "stamina"] },
      { word: "wellness", partOfSpeech: "noun", meaning: "sức khỏe toàn diện cả thể chất lẫn tâm trí", pronunciation: "/ˈwel.nəs/", synonyms: ["well-being", "soundness"] },
      { word: "obesity", partOfSpeech: "noun", meaning: "bệnh béo phì, tình trạng thừa cân", pronunciation: "/əʊˈbiː.sə.ti/", synonyms: ["overweightness", "corpulence"] },
      { word: "stamina", partOfSpeech: "noun", meaning: "sức bền, khả năng duy trì vận động lâu", pronunciation: "/ˈstæm.ɪ.nə/", synonyms: ["endurance", "vigor"] },
      { word: "aerobic", partOfSpeech: "adjective", meaning: "bài tập thể dục hiếu khí (cardio tốt cho tim)", pronunciation: "/eəˈrəʊ.bɪk/", synonyms: ["cardiovascular"] },
      { word: "nutrient", partOfSpeech: "noun", meaning: "chất dinh dưỡng nuôi dưỡng cơ thể", pronunciation: "/ˈnjuː.tri.ənt/", synonyms: ["mineral", "nourishment"] },
      { word: "remedy", partOfSpeech: "noun", meaning: "phương thuốc chữa bệnh, cách khắc phục", pronunciation: "/ˈrem.ə.di/", synonyms: ["cure", "treatment"] },
      { word: "fatigue", partOfSpeech: "noun", meaning: "sự mệt mỏi rã rời, kiệt sức", pronunciation: "/fəˈtiːɡ/", synonyms: ["exhaustion", "tiredness"] },
      { word: "posture", partOfSpeech: "noun", meaning: "tư thế đi đứng, ngồi chuẩn xác", pronunciation: "/ˈpɒs.tʃər/", synonyms: ["stance", "carriage"] },
    ],
  },

  // ==========================================
  // STAGE 2: KHỞI ĐỘNG HỌC THUẬT (BAND 4.5 - 5.5)
  // ==========================================
  {
    name: "Du lịch & Giao thông đô thị (Travel & Transport)",
    slug: "du-lich-giao-thong",
    description: "Chủ đề IELTS rất phổ biến trong Writing Task 1 và Speaking Part 1, 2.",
    stageId: "stage-vocab-2",
    words: [
      { word: "destination", partOfSpeech: "noun", meaning: "điểm đến của hành trình du lịch", pronunciation: "/ˌdes.tɪˈneɪ.ʃən/", synonyms: ["terminus", "target place"] },
      { word: "congestion", partOfSpeech: "noun", meaning: "tình trạng tắc nghẽn giao thông giờ cao điểm", pronunciation: "/kənˈdʒes.tʃən/", synonyms: ["traffic jam", "gridlock"] },
      { word: "infrastructure", partOfSpeech: "noun", meaning: "hệ thống cơ sở hạ tầng giao thông và điện nước", pronunciation: "/ˈɪn.frəˌstrʌk.tʃər/", synonyms: ["facilities", "network"] },
      { word: "hospitality", partOfSpeech: "noun", meaning: "lòng hiếu khách; ngành dịch vụ nhà hàng khách sạn", pronunciation: "/ˌhɒs.pɪˈtæl.ə.ti/", synonyms: ["warm welcome", "accommodation"] },
      { word: "pedestrian", partOfSpeech: "noun", meaning: "người đi bộ lưu thông trên vỉa hè", pronunciation: "/pəˈdes.tri.ən/", synonyms: ["walker", "stroller"] },
      { word: "sustainable", partOfSpeech: "adjective", meaning: "bền vững, thân thiện bảo vệ môi trường", pronunciation: "/səˈsteɪ.nə.bəl/", synonyms: ["eco-friendly", "renewable"] },
      { word: "itinerary", partOfSpeech: "noun", meaning: "lịch trình chi tiết của chuyến đi", pronunciation: "/aɪˈtɪn.ər.ər.i/", synonyms: ["travel plan", "schedule"] },
      { word: "accessibility", partOfSpeech: "noun", meaning: "khả năng tiếp cận phương tiện thuận tiện", pronunciation: "/əkˌses.əˈbɪl.ə.ti/", synonyms: ["availability", "reachability"] },
      { word: "commuter", partOfSpeech: "noun", meaning: "người đi lại hàng ngày bằng xe buýt hoặc tàu điện", pronunciation: "/kəˈmjuː.tər/", synonyms: ["daily traveler"] },
      { word: "transit", partOfSpeech: "noun", meaning: "sự vận chuyển hành khách công cộng", pronunciation: "/ˈtræn.zɪt/", synonyms: ["public transportation", "conveyance"] },
    ],
  },
  {
    name: "Môi trường & Sinh thái học (Environment & Ecology)",
    slug: "moi-truong-sinh-thai",
    description: "Bộ từ vựng then chốt cho đề thi IELTS Writing Task 2 về biến đổi khí hậu và bảo tồn.",
    stageId: "stage-vocab-2",
    words: [
      { word: "conservation", partOfSpeech: "noun", meaning: "công tác bảo tồn thiên nhiên và loài hoang dã", pronunciation: "/ˌkɒn.səˈveɪ.ʃən/", synonyms: ["preservation", "protection"] },
      { word: "ecosystem", partOfSpeech: "noun", meaning: "hệ sinh thái tự nhiên hài hòa", pronunciation: "/ˈiː.kəʊˌsɪs.təm/", synonyms: ["biome", "environment"] },
      { word: "habitat", partOfSpeech: "noun", meaning: "môi trường sống tự nhiên của sinh vật", pronunciation: "/ˈhæb.ɪ.tæt/", synonyms: ["natural home", "territory"] },
      { word: "deforestation", partOfSpeech: "noun", meaning: "nạn tàn phá rừng hàng loạt", pronunciation: "/diːˌfɒr.ɪˈsteɪ.ʃən/", synonyms: ["forest clearance", "logging"] },
      { word: "biodiversity", partOfSpeech: "noun", meaning: "sự đa dạng sinh học trong tự nhiên", pronunciation: "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", synonyms: ["ecological variety"] },
      { word: "pollutant", partOfSpeech: "noun", meaning: "chất gây ô nhiễm độc hại", pronunciation: "/pəˈluː.tənt/", synonyms: ["contaminant", "waste"] },
      { word: "extinction", partOfSpeech: "noun", meaning: "sự tuyệt chủng của một loài sinh vật", pronunciation: "/ɪkˈstɪŋk.ʃən/", synonyms: ["dying out", "disappearance"] },
      { word: "renewable", partOfSpeech: "adjective", meaning: "nguồn năng lượng tái tạo vô tận (gió, mặt trời)", pronunciation: "/rɪˈnjuː.ə.bəl/", synonyms: ["sustainable", "replenishable"] },
      { word: "catastrophe", partOfSpeech: "noun", meaning: "thảm họa thiên nhiên tàn phá nặng nề", pronunciation: "/kəˈtæs.trə.fi/", synonyms: ["disaster", "calamity"] },
      { word: "footprint", partOfSpeech: "noun", meaning: "lượng khí thải carbon tác động lên trái đất", pronunciation: "/ˈfʊt.prɪnt/", synonyms: ["environmental impact"] },
    ],
  },
  {
    name: "Giáo dục & Hướng nghiệp (Education & Career)",
    slug: "giao-duc-huong-nghiep",
    description: "Chủ đề học thuật xuất hiện liên tục trong cả 4 kỹ năng thi IELTS.",
    stageId: "stage-vocab-2",
    words: [
      { word: "pedagogy", partOfSpeech: "noun", meaning: "nghệ thuật và phương pháp sư phạm giảng dạy", pronunciation: "/ˈped.ə.ɡɒdʒ.i/", synonyms: ["teaching method", "instruction"] },
      { word: "vocational", partOfSpeech: "adjective", meaning: "mang tính hướng nghiệp đào tạo nghề thực tế", pronunciation: "/vəʊˈkeɪ.ʃən.əl/", synonyms: ["occupational", "career-oriented"] },
      { word: "scholarship", partOfSpeech: "noun", meaning: "học bổng khuyến khích tài năng", pronunciation: "/ˈskɒl.ə.ʃɪp/", synonyms: ["financial grant", "bursary"] },
      { word: "tuition", partOfSpeech: "noun", meaning: "khoản tiền học phí phải đóng", pronunciation: "/tjuːˈɪʃ.ən/", synonyms: ["school fees", "educational charge"] },
      { word: "cognitive", partOfSpeech: "adjective", meaning: "thuộc về nhận thức và tư duy phân tích", pronunciation: "/ˈkɒɡ.nə.tɪv/", synonyms: ["mental", "intellectual"] },
      { word: "aptitude", partOfSpeech: "noun", meaning: "năng khiếu bẩm sinh, sở trường tự nhiên", pronunciation: "/ˈæp.tɪ.tjuːd/", synonyms: ["talent", "natural ability"] },
      { word: "tertiary", partOfSpeech: "adjective", meaning: "thuộc bậc đại học và sau đại học", pronunciation: "/ˈtɜː.ʃər.i/", synonyms: ["higher education", "university-level"] },
      { word: "extracurricular", partOfSpeech: "adjective", meaning: "hoạt động ngoại khóa rèn kỹ năng mềm", pronunciation: "/ˌek.strə.kəˈrɪk.jə.lər/", synonyms: ["after-school activity"] },
      { word: "mentor", partOfSpeech: "noun", meaning: "người cố vấn dày dặn kinh nghiệm dẫn dắt", pronunciation: "/ˈmen.tɔːr/", synonyms: ["advisor", "counselor"] },
      { word: "literacy", partOfSpeech: "noun", meaning: "trình độ biết đọc biết viết và học vấn căn bản", pronunciation: "/ˈlɪt.ər.ə.si/", synonyms: ["competence", "knowledge"] },
    ],
  },
  {
    name: "Công nghệ số & Thiết bị thông minh (Digital Technology)",
    slug: "cong-nghe-so",
    description: "Từ vựng về xu hướng công nghệ, mạng xã hội và tác động lên giới trẻ.",
    stageId: "stage-vocab-2",
    words: [
      { word: "innovation", partOfSpeech: "noun", meaning: "sự đổi mới mang tính sáng tạo đột phá", pronunciation: "/ˌɪn.əˈveɪ.ʃən/", synonyms: ["breakthrough", "novelty"] },
      { word: "automate", partOfSpeech: "verb", meaning: "tự động hóa quy trình sản xuất và xử lý", pronunciation: "/ˈɔː.tə.meɪt/", synonyms: ["mechanize", "computerize"] },
      { word: "artificial", partOfSpeech: "adjective", meaning: "nhân tạo do con người tạo ra", pronunciation: "/ˌɑː.tɪˈfɪʃ.əl/", synonyms: ["synthetic", "man-made"] },
      { word: "cyberspace", partOfSpeech: "noun", meaning: "không gian mạng Internet ảo", pronunciation: "/ˈsaɪ.bə.speɪs/", synonyms: ["virtual world", "online sphere"] },
      { word: "digitalize", partOfSpeech: "verb", meaning: "số hóa các dịch vụ và dữ liệu", pronunciation: "/ˈdɪdʒ.ɪ.təl.aɪz/", synonyms: ["digitize", "computerize"] },
      { word: "revolutionize", partOfSpeech: "verb", meaning: "cách mạng hóa, thay đổi triệt để phương thức", pronunciation: "/ˌrev.əˈluː.ʃən.aɪz/", synonyms: ["transform", "reshape"] },
      { word: "obsolescence", partOfSpeech: "noun", meaning: "tình trạng trở nên lỗi thời, bị đào thải", pronunciation: "/ˌɒb.səˈles.ns/", synonyms: ["outdatedness", "antiquity"] },
      { word: "connectivity", partOfSpeech: "noun", meaning: "khả năng kết nối thông suốt giữa các thiết bị", pronunciation: "/kəˌnekˈtɪv.ə.ti/", synonyms: ["networking", "linkage"] },
      { word: "telecommunication", partOfSpeech: "noun", meaning: "ngành viễn thông và truyền phát tín hiệu", pronunciation: "/ˌtel.ɪ.kəˌmjuː.nɪˈkeɪ.ʃən/", synonyms: ["broadcasting", "data transmission"] },
      { word: "device", partOfSpeech: "noun", meaning: "thiết bị điện tử cầm tay thông minh", pronunciation: "/dɪˈvaɪs/", synonyms: ["gadget", "appliance"] },
    ],
  },

  // ==========================================
  // STAGE 3: BỨT PHÁ HỌC THUẬT (BAND 5.5 - 6.5)
  // ==========================================
  {
    name: "Academic Word List: Tư duy & Phương pháp luận (AWL: Research)",
    slug: "awl-tu-duy-phuong-phap",
    description: "Bộ từ vựng Academic Word List đắt giá dùng để nâng tầm Writing Task 2.",
    stageId: "stage-vocab-3",
    words: [
      { word: "empirical", partOfSpeech: "adjective", meaning: "dựa trên bằng chứng thực nghiệm quan sát", pronunciation: "/ɪmˈpɪr.ɪ.kəl/", synonyms: ["observational", "experimental"] },
      { word: "hypothesis", partOfSpeech: "noun", meaning: "giả thuyết khoa học cần chứng minh", pronunciation: "/haɪˈpɒθ.ə.sɪs/", synonyms: ["proposition", "theory"] },
      { word: "methodology", partOfSpeech: "noun", meaning: "hệ thống phương pháp luận nghiên cứu", pronunciation: "/ˌmeθ.əˈdɒl.ə.dʒi/", synonyms: ["research framework", "procedure"] },
      { word: "correlate", partOfSpeech: "verb", meaning: "có mối liên hệ mật thiết, tương quan", pronunciation: "/ˈkɒr.ə.leɪt/", synonyms: ["associate", "connect"] },
      { word: "validate", partOfSpeech: "verb", meaning: "xác thực tính chuẩn xác và tin cậy", pronunciation: "/ˈvæl.ɪ.deɪt/", synonyms: ["confirm", "authenticate"] },
      { word: "contradict", partOfSpeech: "verb", meaning: "mâu thuẫn, phản bác luận điểm trước", pronunciation: "/ˌkɒn.trəˈdɪkt/", synonyms: ["refute", "counter"] },
      { word: "parameter", partOfSpeech: "noun", meaning: "thông số giới hạn của phạm vi nghiên cứu", pronunciation: "/pəˈræm.ɪ.tər/", synonyms: ["variable", "criterion"] },
      { word: "qualitative", partOfSpeech: "adjective", meaning: "phương pháp mang tính định tính (phỏng vấn, mô tả)", pronunciation: "/ˈkwɒl.ɪ.tə.tɪv/", synonyms: ["descriptive", "narrative"] },
      { word: "quantitative", partOfSpeech: "adjective", meaning: "phương pháp mang tính định lượng (con số, tỷ lệ)", pronunciation: "/ˈkwɒn.tɪ.tə.tɪv/", synonyms: ["numerical", "statistical"] },
      { word: "dissect", partOfSpeech: "verb", meaning: "mổ xẻ, phân tích cặn kẽ từng khía cạnh", pronunciation: "/dɪˈsekt/", synonyms: ["analyze closely", "examine deeply"] },
    ],
  },
  {
    name: "Đô thị hóa & Cơ sở hạ tầng (Urbanization & Cities)",
    slug: "do-thi-hoa-ha-tang",
    description: "Từ vựng thảo luận về quy hoạch đô thị, ô nhiễm và cuộc sống thành phố lớn.",
    stageId: "stage-vocab-3",
    words: [
      { word: "metropolis", partOfSpeech: "noun", meaning: "đại đô thị trung tâm kinh tế sầm uất", pronunciation: "/məˈtrɒp.əl.ɪs/", synonyms: ["megacity", "capital center"] },
      { word: "demography", partOfSpeech: "noun", meaning: "nghiên cứu nhân khẩu học và cơ cấu tuổi", pronunciation: "/dɪˈmɒɡ.rə.fi/", synonyms: ["population statistics"] },
      { word: "gentrification", partOfSpeech: "noun", meaning: "quá trình cải tạo làm giàu khu đô thị", pronunciation: "/ˌdʒen.trɪ.fɪˈkeɪ.ʃən/", synonyms: ["urban renewal", "revitalization"] },
      { word: "sprawl", partOfSpeech: "noun", meaning: "sự phình to tràn lan mất kiểm soát của thành phố", pronunciation: "/sprɔːl/ ", synonyms: ["overexpansion", "dispersion"] },
      { word: "civic", partOfSpeech: "adjective", meaning: "thuộc về cộng đồng cư dân thành thị", pronunciation: "/ˈsɪv.ɪk/", synonyms: ["public", "municipal"] },
      { word: "sanitation", partOfSpeech: "noun", meaning: "hệ thống xử lý vệ sinh và rác thải đô thị", pronunciation: "/ˌsæn.ɪˈteɪ.ʃən/", synonyms: ["public cleanliness", "drainage"] },
      { word: "municipal", partOfSpeech: "adjective", meaning: "thuộc quyền quản lý của chính quyền đô thị", pronunciation: "/mjuːˈnɪs.ɪ.pəl/", synonyms: ["city council", "governmental"] },
      { word: "accommodate", partOfSpeech: "verb", meaning: "đáp ứng chỗ ăn ở cho số lượng lớn người nhập cư", pronunciation: "/əˈkɒm.ə.deɪt/", synonyms: ["shelter", "house"] },
      { word: "residential", partOfSpeech: "adjective", meaning: "khu vực thuần dành cho người dân sinh sống", pronunciation: "/ˌrez.ɪˈden.ʃəl/", synonyms: ["suburban", "housing"] },
      { word: "density", partOfSpeech: "noun", meaning: "mật độ phân bổ dân cư dày đặc", pronunciation: "/ˈden.sə.ti/", synonyms: ["crowdedness", "concentration"] },
    ],
  },
  {
    name: "Kinh tế & Thị trường việc làm (Economics & Employment)",
    slug: "kinh-te-viec-lam",
    description: "Hệ thống từ vựng về tài khóa, lạm phát, việc làm tự do và suy thoái kinh tế.",
    stageId: "stage-vocab-3",
    words: [
      { word: "fiscal", partOfSpeech: "adjective", meaning: "thuộc về chính sách tài khóa ngân sách quốc gia", pronunciation: "/ˈfɪs.kəl/", synonyms: ["budgetary", "financial"] },
      { word: "recession", partOfSpeech: "noun", meaning: "thời kỳ suy thoái kinh tế đình đốn", pronunciation: "/rɪˈseʃ.ən/", synonyms: ["downturn", "economic slump"] },
      { word: "inflation", partOfSpeech: "noun", meaning: "tình trạng lạm phát khiến giá tiêu dùng leo thang", pronunciation: "/ɪnˈfleɪ.ʃən/", synonyms: ["price hike", "currency drop"] },
      { word: "deficit", partOfSpeech: "noun", meaning: "sự thâm hụt cán cân thu chi ngân sách", pronunciation: "/ˈdef.ɪ.sɪt/", synonyms: ["shortfall", "shortage"] },
      { word: "revenue", partOfSpeech: "noun", meaning: "tổng nguồn thu nhập từ thuế hoặc kinh doanh", pronunciation: "/ˈrev.ən.juː/", synonyms: ["income", "earnings"] },
      { word: "freelance", partOfSpeech: "adjective", meaning: "hành nghề tự do độc lập không biên chế", pronunciation: "/ˈfriː.lɑːns/", synonyms: ["self-employed", "contractor"] },
      { word: "prosperity", partOfSpeech: "noun", meaning: "sự thịnh vượng, sung túc phồn vinh", pronunciation: "/prɒsˈper.ə.ti/", synonyms: ["affluence", "wealth"] },
      { word: "subsistence", partOfSpeech: "noun", meaning: "mức sống tối thiểu vừa đủ sinh tồn", pronunciation: "/səbˈsɪs.təns/", synonyms: ["bare survival", "minimal living"] },
      { word: "commercialize", partOfSpeech: "verb", meaning: "thương mại hóa ý tưởng sáng tạo", pronunciation: "/kəˈmɜː.ʃəl.aɪz/", synonyms: ["monetize", "market"] },
      { word: "monopoly", partOfSpeech: "noun", meaning: "sự độc quyền thị trường của một tập đoàn", pronunciation: "/məˈnɒp.əl.i/", synonyms: ["exclusive control"] },
    ],
  },
  {
    name: "Truyền thông & Đạo đức báo chí (Media & Ethics)",
    slug: "truyen-thong-dao-duc",
    description: "Chủ đề thời sự về kiểm duyệt, tin giả và tầm ảnh hưởng của báo mạng.",
    stageId: "stage-vocab-3",
    words: [
      { word: "censorship", partOfSpeech: "noun", meaning: "hành vi kiểm duyệt nội dung xuất bản", pronunciation: "/ˈsen.sə.ʃɪp/", synonyms: ["suppression", "filtering"] },
      { word: "misinformation", partOfSpeech: "noun", meaning: "thông tin sai lệch lan truyền vô tình", pronunciation: "/ˌmɪs.ɪn.fəˈmeɪ.ʃən/", synonyms: ["inaccuracy", "false rumor"] },
      { word: "disinformation", partOfSpeech: "noun", meaning: "tin tức giả mạo được cố tình thêu dệt", pronunciation: "/ˌdɪs.ɪn.fəˈmeɪ.ʃən/", synonyms: ["fake news", "propaganda"] },
      { word: "sensationalize", partOfSpeech: "verb", meaning: "giật gân hóa tiêu đề để câu lượt xem", pronunciation: "/senˈseɪ.ʃən.əl.aɪz/", synonyms: ["exaggerate", "overdramatize"] },
      { word: "unbiased", partOfSpeech: "adjective", meaning: "khách quan công tâm, không thiên vị phe nào", pronunciation: "/ʌnˈbaɪ.əst/", synonyms: ["impartial", "objective"] },
      { word: "credibility", partOfSpeech: "noun", meaning: "độ tin cậy và danh tiếng của nguồn tin", pronunciation: "/ˌkred.əˈbɪl.ə.ti/", synonyms: ["trustworthiness", "integrity"] },
      { word: "manipulate", partOfSpeech: "verb", meaning: "thao túng dư luận qua ngôn từ truyền thông", pronunciation: "/məˈnɪp.jə.leɪt/", synonyms: ["steer", "influence deviously"] },
      { word: "scrutiny", partOfSpeech: "noun", meaning: "sự thanh tra và soi xét kỹ lưỡng từ công chúng", pronunciation: "/ˈskruː.tɪ.ni/", synonyms: ["critical inspection"] },
      { word: "broadcast", partOfSpeech: "verb", meaning: "phát sóng chương trình rộng rãi qua truyền hình", pronunciation: "/ˈbrɔːd.kɑːst/", synonyms: ["air", "transmit"] },
      { word: "journalism", partOfSpeech: "noun", meaning: "ngành nghề làm báo chuyên nghiệp", pronunciation: "/ˈdʒɜː.nə.lɪ.zəm/", synonyms: ["news reporting", "the press"] },
    ],
  },

  // ==========================================
  // STAGE 4: TINH THÔNG CAO CẤP (BAND 6.5 - 7.5+)
  // ==========================================
  {
    name: "Trí tuệ nhân tạo & Đạo đức công nghệ (AI & Tech Ethics)",
    slug: "tri-tue-nhan-tao-dao-duc",
    description: "Bộ từ vựng cao cấp C1/C2 về thuật toán máy học, giám sát dữ liệu và tự động hóa.",
    stageId: "stage-vocab-4",
    words: [
      { word: "algorithm", partOfSpeech: "noun", meaning: "thuật toán vi tính tự động phân tích dữ liệu", pronunciation: "/ˈæl.ɡə.rɪ.ðəm/", synonyms: ["computational formula", "code logic"] },
      { word: "autonomous", partOfSpeech: "adjective", meaning: "tự vận hành độc lập không cần con người can thiệp", pronunciation: "/ɔːˈtɒn.ə.məs/", synonyms: ["self-governing", "independent"] },
      { word: "heuristic", partOfSpeech: "adjective", meaning: "phương pháp thử nghiệm phỏng đoán giải quyết vấn đề", pronunciation: "/hjuˈrɪs.tɪk/", synonyms: ["practical rule", "exploratory"] },
      { word: "paradigm", partOfSpeech: "noun", meaning: "mô hình chuẩn mực hoặc hệ tư duy bao quát", pronunciation: "/ˈpær.ə.daɪm/", synonyms: ["standard model", "archetype"] },
      { word: "surveillance", partOfSpeech: "noun", meaning: "sự giám sát camera và theo dõi kỹ thuật số", pronunciation: "/sɜːˈveɪ.ləns/", synonyms: ["monitoring", "observation"] },
      { word: "sentient", partOfSpeech: "adjective", meaning: "có tri giác và khả năng nhận biết cảm xúc", pronunciation: "/ˈsen.ʃənt/", synonyms: ["conscious", "aware"] },
      { word: "proliferate", partOfSpeech: "verb", meaning: "sinh sôi nảy nở nhanh chóng với quy mô lớn", pronunciation: "/prəˈlɪf.ər.eɪt/", synonyms: ["multiply rapidly", "mushroom"] },
      { word: "ubiquitous", partOfSpeech: "adjective", meaning: "hiện diện ở khắp mọi ngóc ngách cuộc sống", pronunciation: "/juːˈbɪk.wɪ.təs/", synonyms: ["omnipresent", "pervasive"] },
      { word: "scrutinize", partOfSpeech: "verb", meaning: "nghiên cứu xem xét cẩn trọng đến từng chi tiết", pronunciation: "/ˈskruː.tɪ.naɪz/", synonyms: ["inspect meticulously", "dissect"] },
      { word: "meticulous", partOfSpeech: "adjective", meaning: "tỉ mỉ, cẩn trọng tuyệt đối không để xảy ra sai sót", pronunciation: "/məˈtɪk.jə.ləs/", synonyms: ["thorough", "painstaking"] },
    ],
  },
  {
    name: "Biến đổi khí hậu & Địa sinh thái (Climate & Ecology)",
    slug: "bien-doi-khi-hau-dia-sinh-thai",
    description: "Thuật ngữ học thuật chuyên sâu về ấm lên toàn cầu, điểm tới hạn và suy thoái biển.",
    stageId: "stage-vocab-4",
    words: [
      { word: "anthropogenic", partOfSpeech: "adjective", meaning: "có nguồn gốc trực tiếp do hoạt động con người gây nên", pronunciation: "/ˌæn.θrə.pəˈdʒen.ɪk/", synonyms: ["human-caused", "man-made"] },
      { word: "acidification", partOfSpeech: "noun", meaning: "hiện tượng axit hóa nước biển đe dọa rạn san hô", pronunciation: "/əˌsɪd.ɪ.fɪˈkeɪ.ʃən/", synonyms: ["chemical pH drop"] },
      { word: "sequestration", partOfSpeech: "noun", meaning: "sự cô lập và lưu giữ carbon dưới lòng đất hoặc rừng", pronunciation: "/ˌsiː.kwesˈtreɪ.ʃən/", synonyms: ["carbon capture", "isolation"] },
      { word: "vulnerable", partOfSpeech: "adjective", meaning: "dễ bị tổn thương trước thiên tai khốc liệt", pronunciation: "/ˈvʌl.nər.ə.bəl/", synonyms: ["susceptible", "defenseless"] },
      { word: "mitigation", partOfSpeech: "noun", meaning: "các biện pháp giảm nhẹ thiệt hại môi trường", pronunciation: "/ˌmɪt.ɪˈɡeɪ.ʃən/", synonyms: ["alleviation", "reduction"] },
      { word: "degradation", partOfSpeech: "noun", meaning: "sự suy thoái xuống cấp của đất đai và tài nguyên", pronunciation: "/ˌdeɡ.rəˈdeɪ.ʃən/", synonyms: ["deterioration", "wear-down"] },
      { word: "precipitation", partOfSpeech: "noun", meaning: "lượng mưa và tuyết rơi theo khí hậu học", pronunciation: "/prɪˌsɪp.ɪˈteɪ.ʃən/", synonyms: ["rainfall", "downpour"] },
      { word: "unfeasible", partOfSpeech: "adjective", meaning: "bất khả thi do chi phí quá lớn hoặc rào cản kỹ thuật", pronunciation: "/ʌnˈfiː.zə.bəl/", synonyms: ["impractical", "unachievable"] },
      { word: "biodepletion", partOfSpeech: "noun", meaning: "sự cạn kiệt tài nguyên động thực vật tự nhiên", pronunciation: "/ˌbaɪ.əʊ.dɪˈpliː.ʃən/", synonyms: ["species reduction"] },
      { word: "resilience", partOfSpeech: "noun", meaning: "khả năng phục hồi và chống chịu của hệ sinh thái", pronunciation: "/rɪˈzɪl.jəns/", synonyms: ["elasticity", "toughness"] },
    ],
  },
  {
    name: "Tâm lý học & Hành vi nhận thức (Psychology & Mind)",
    slug: "tam-ly-hoc-nhan-thuc",
    description: "Bộ từ vựng đắt giá về định kiến vô thức, xung đột nhận thức và tâm lý đám đông.",
    stageId: "stage-vocab-4",
    words: [
      { word: "predispose", partOfSpeech: "verb", meaning: "dẫn dắt xu hướng hành vi, làm cho dễ mắc phải", pronunciation: "/ˌpriː.dɪˈspəʊz/", synonyms: ["make susceptible", "incline"] },
      { word: "dissonance", partOfSpeech: "noun", meaning: "sự bất hòa, căng thẳng tâm lý khi niềm tin mâu thuẫn", pronunciation: "/ˈdɪs.ə.nəns/", synonyms: ["disagreement", "mental conflict"] },
      { word: "perception", partOfSpeech: "noun", meaning: "sự tri giác và cách nhìn nhận thế giới xung quanh", pronunciation: "/pəˈsep.ʃən/", synonyms: ["sensory insight", "comprehension"] },
      { word: "subconscious", partOfSpeech: "adjective", meaning: "nằm sâu trong tiềm thức, chi phối thói quen", pronunciation: "/ˌsʌbˈkɒn.ʃəs/", synonyms: ["subliminal", "unconscious"] },
      { word: "temperament", partOfSpeech: "noun", meaning: "khí chất tính cách bẩm sinh của cá nhân", pronunciation: "/ˈtem.pər.ə.mənt/", synonyms: ["disposition", "nature"] },
      { word: "innate", partOfSpeech: "adjective", meaning: "bẩm sinh vốn có từ trong gen, không do học hỏi", pronunciation: "/ɪˈneɪt/", synonyms: ["inborn", "congenital"] },
      { word: "stimulus", partOfSpeech: "noun", meaning: "tác nhân gây kích thích phản xạ thần kinh", pronunciation: "/ˈstɪm.jə.ləs/", synonyms: ["catalyst", "provocation"] },
      { word: "neuroplasticity", partOfSpeech: "noun", meaning: "khả năng mềm dẻo tái cấu trúc của các nơ-ron não bộ", pronunciation: "/ˌnjʊə.rəʊ.plæsˈtɪs.ə.ti/", synonyms: ["brain adaptability"] },
      { word: "bias", partOfSpeech: "noun", meaning: "định kiến vô thức ảnh hưởng đến quyết định", pronunciation: "/ˈbaɪ.əs/", synonyms: ["prejudice", "partiality"] },
      { word: "eloquent", partOfSpeech: "adjective", meaning: "hùng biện, có tài diễn đạt ngôn từ truyền cảm hứng", pronunciation: "/ˈel.ə.kwənt/", synonyms: ["articulate", "persuasive"] },
    ],
  },
  {
    name: "Địa chính trị & Ngoại giao quốc tế (Geopolitics & Diplomacy)",
    slug: "dia-chinh-tri-ngoai-giao",
    description: "Từ vựng đỉnh cao về chủ quyền, hiệp ước đa phương và bá quyền quan hệ quốc tế.",
    stageId: "stage-vocab-4",
    words: [
      { word: "sovereignty", partOfSpeech: "noun", meaning: "chủ quyền quốc gia thiêng liêng tối thượng", pronunciation: "/ˈsɒv.rɪn.ti/", synonyms: ["autonomy", "national independence"] },
      { word: "diplomacy", partOfSpeech: "noun", meaning: "nghệ thuật đàm phán và quan hệ ngoại giao", pronunciation: "/dɪˈpləʊ.mə.si/", synonyms: ["statesmanship", "negotiation"] },
      { word: "bilateral", partOfSpeech: "adjective", meaning: "hiệp định mang tính song phương giữa 2 nước", pronunciation: "/baɪˈlæt.ər.əl/", synonyms: ["mutual", "two-sided"] },
      { word: "multilateral", partOfSpeech: "adjective", meaning: "khế ước mang tính đa phương của nhiều quốc gia", pronunciation: "/ˌmʌl.tɪˈlæt.ər.əl/", synonyms: ["multiparty", "international"] },
      { word: "sanction", partOfSpeech: "noun", meaning: "lệnh cấm vận trừng phạt kinh tế quốc tế", pronunciation: "/ˈsæŋk.ʃən/", synonyms: ["embargo", "trade penalty"] },
      { word: "hegemony", partOfSpeech: "noun", meaning: "vị thế bá quyền áp đảo về quân sự hoặc kinh tế", pronunciation: "/hɪˈɡem.ə.ni/", synonyms: ["supremacy", "leadership dominance"] },
      { word: "jurisdiction", partOfSpeech: "noun", meaning: "thẩm quyền pháp lý và phạm vi quyền tài phán", pronunciation: "/ˌdʒʊə.rɪsˈdɪk.ʃən/", synonyms: ["legal authority", "command"] },
      { word: "treaty", partOfSpeech: "noun", meaning: "hiệp ước bang giao có hiệu lực pháp lý ràng buộc", pronunciation: "/ˈtriː.ti/", synonyms: ["accord", "covenant"] },
      { word: "coalition", partOfSpeech: "noun", meaning: "liên minh các quốc gia chung mục tiêu chiến lược", pronunciation: "/ˌkəʊ.əˈlɪʃ.ən/", synonyms: ["alliance", "partnership bloc"] },
      { word: "geopolitical", partOfSpeech: "adjective", meaning: "thuộc về địa chính trị chiến lược toàn cầu", pronunciation: "/ˌdʒiː.əʊ.pəˈlɪt.ɪ.kəl/", synonyms: ["strategic geographic politics"] },
    ],
  },
];

async function seedVocabTopics() {
  console.log("Seeding 16 curated IELTS topics & vocabulary words...");

  const useSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalWordsAdded = 0;

    for (let tIdx = 0; tIdx < TOPICS_DATA.length; tIdx++) {
      const topicData = TOPICS_DATA[tIdx];

      // Insert or get Topic
      const topicRes = await client.query(
        `
        INSERT INTO topics (name, slug, description, is_visible)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_visible = true
        RETURNING id;
      `,
        [topicData.name, topicData.slug, topicData.description]
      );

      const topicId = topicRes.rows[0].id;

      // Map Topic into Roadmap Stage
      await client.query(
        `
        INSERT INTO roadmap_stage_topics (stage_id, topic_id, sort_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (stage_id, topic_id) DO UPDATE SET sort_order = EXCLUDED.sort_order;
      `,
        [topicData.stageId, topicId, tIdx + 1]
      );

      // Insert Words for this Topic
      for (const w of topicData.words) {
        const normalized = w.word.trim().toLowerCase();
        await client.query(
          `
          INSERT INTO words (topic_id, word, word_normalized, part_of_speech, meaning, pronunciation, synonyms)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (topic_id, word_normalized, COALESCE(part_of_speech, ''))
          DO UPDATE SET
            meaning = EXCLUDED.meaning,
            pronunciation = EXCLUDED.pronunciation,
            synonyms = EXCLUDED.synonyms;
        `,
          [
            topicId,
            w.word,
            normalized,
            w.partOfSpeech,
            w.meaning,
            w.pronunciation,
            JSON.stringify(w.synonyms),
          ]
        );
        totalWordsAdded++;
      }
    }

    await client.query("COMMIT");
    console.log(`✓ Successfully seeded ${TOPICS_DATA.length} topics and ${totalWordsAdded} authentic IELTS words!`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed vocab error:", err);
  } finally {
    client.release();
  }
}

seedVocabTopics();
