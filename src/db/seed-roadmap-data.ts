import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ielts_db";

async function seedRoadmapData() {
  console.log("Seeding IELTS Roadmap, Grammar Lessons & Practice Tests...");

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

    // =========================================================
    // 1. SEED ROADMAPS (TỪ VỰNG & NGỮ PHÁP)
    // =========================================================
    await client.query(`
      INSERT INTO roadmaps (id, name, slug, description, type, target_band, is_default, is_active, sort_order)
      VALUES 
      (
        'ielts-vocab-master',
        'Lộ trình Chinh phục Từ vựng IELTS Toàn diện',
        'tu-vung-toan-dien',
        'Lộ trình từ vựng bài bản chuẩn hóa theo từng Target Band từ 3.5 đến 7.5+, phân bổ qua các bộ thẻ Flashcards học thuật.',
        'vocabulary',
        '6.5 - 7.5+',
        true,
        true,
        1
      ),
      (
        'ielts-grammar-master',
        'Lộ trình Ngữ pháp Thực chiến IELTS',
        'ngu-phap-thuc-chien',
        'Lộ trình làm chủ ngữ pháp chuẩn tiêu chí Grammatical Range & Accuracy trong IELTS Writing & Speaking.',
        'grammar',
        '6.5 - 8.0',
        true,
        true,
        2
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        target_band = EXCLUDED.target_band,
        updated_at = NOW();
    `);
    console.log("✓ Seeded roadmaps (Vocabulary & Grammar)");

    // =========================================================
    // 2. SEED ROADMAP STAGES (CÁC CHẶNG)
    // =========================================================
    // Stages for Vocabulary
    const vocabStages = [
      {
        id: "stage-vocab-1",
        roadmapId: "ielts-vocab-master",
        stageNumber: 1,
        name: "Chặng 1: Nền tảng Khởi động",
        slug: "nen-tang-khoi-dong",
        bandRange: "3.5 - 4.5",
        description: "Xây dựng vốn từ giao tiếp, sinh hoạt thường nhật và trường học cơ bản.",
        iconName: "Compass",
        accentColor: "emerald",
        requiredKnownPercent: 80,
        requiredQuizScore: 80,
        sortOrder: 1,
      },
      {
        id: "stage-vocab-2",
        roadmapId: "ielts-vocab-master",
        stageNumber: 2,
        name: "Chặng 2: Khởi động Học thuật",
        slug: "khoi-dong-hoc-thuat",
        bandRange: "4.5 - 5.5",
        description: "Làm quen với các chủ đề IELTS quen thuộc: Giáo dục, Du lịch, Môi trường, Sức khỏe.",
        iconName: "BookOpen",
        accentColor: "sky",
        requiredKnownPercent: 80,
        requiredQuizScore: 80,
        sortOrder: 2,
      },
      {
        id: "stage-vocab-3",
        roadmapId: "ielts-vocab-master",
        stageNumber: 3,
        name: "Chặng 3: Bứt phá Học thuật",
        slug: "but-pha-hoc-thuat",
        bandRange: "5.5 - 6.5",
        description: "Làm chủ từ vựng học thuật AWL (Academic Word List) cốt lõi phục vụ Writing & Reading.",
        iconName: "Flame",
        accentColor: "amber",
        requiredKnownPercent: 80,
        requiredQuizScore: 80,
        sortOrder: 3,
      },
      {
        id: "stage-vocab-4",
        roadmapId: "ielts-vocab-master",
        stageNumber: 4,
        name: "Chặng 4: Tinh thông Cao cấp",
        slug: "tinh-thong-cao-cap",
        bandRange: "6.5 - 7.5+",
        description: "Chinh phục Collocations học thuật nâng cao, Idiomatic expressions và sắc thái nghĩa C1/C2.",
        iconName: "Trophy",
        accentColor: "purple",
        requiredKnownPercent: 85,
        requiredQuizScore: 85,
        sortOrder: 4,
      },
    ];

    for (const s of vocabStages) {
      await client.query(
        `
        INSERT INTO roadmap_stages (id, roadmap_id, stage_number, name, slug, band_range, description, icon_name, accent_color, required_known_percent, required_quiz_score, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          band_range = EXCLUDED.band_range,
          accent_color = EXCLUDED.accent_color,
          icon_name = EXCLUDED.icon_name;
      `,
        [
          s.id,
          s.roadmapId,
          s.stageNumber,
          s.name,
          s.slug,
          s.bandRange,
          s.description,
          s.iconName,
          s.accentColor,
          s.requiredKnownPercent,
          s.requiredQuizScore,
          s.sortOrder,
        ]
      );
    }

    // Stages for Grammar
    const grammarStages = [
      {
        id: "stage-grammar-1",
        roadmapId: "ielts-grammar-master",
        stageNumber: 1,
        name: "Chặng 1: Nền tảng Ngữ pháp Vững chắc",
        slug: "ngu-phap-nen-tang",
        bandRange: "4.0 - 5.0",
        description: "Nắm vững các thì trọng tâm, cấu trúc câu căn bản và mạo từ học thuật chuẩn xác.",
        iconName: "Layers",
        accentColor: "emerald",
        requiredKnownPercent: 80,
        requiredQuizScore: 80,
        sortOrder: 1,
      },
      {
        id: "stage-grammar-2",
        roadmapId: "ielts-grammar-master",
        stageNumber: 2,
        name: "Chặng 2: Nâng chuẩn Câu Linh hoạt",
        slug: "ngu-phap-trung-cap",
        bandRange: "5.0 - 6.0",
        description: "Làm chủ mệnh đề quan hệ, câu bị động học thuật, câu điều kiện và ngôn ngữ dè dặt (Hedging).",
        iconName: "Sparkles",
        accentColor: "amber",
        requiredKnownPercent: 80,
        requiredQuizScore: 80,
        sortOrder: 2,
      },
      {
        id: "stage-grammar-3",
        roadmapId: "ielts-grammar-master",
        stageNumber: 3,
        name: "Chặng 3: Ngữ pháp Học thuật Đột phá",
        slug: "ngu-phap-cao-cap",
        bandRange: "6.5 - 7.5+",
        description: "Bứt phá điểm Grammatical Range với mệnh đề rút gọn, đảo ngữ, câu chẻ và danh từ hóa.",
        iconName: "GraduationCap",
        accentColor: "purple",
        requiredKnownPercent: 85,
        requiredQuizScore: 85,
        sortOrder: 3,
      },
    ];

    for (const s of grammarStages) {
      await client.query(
        `
        INSERT INTO roadmap_stages (id, roadmap_id, stage_number, name, slug, band_range, description, icon_name, accent_color, required_known_percent, required_quiz_score, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          band_range = EXCLUDED.band_range,
          accent_color = EXCLUDED.accent_color,
          icon_name = EXCLUDED.icon_name;
      `,
        [
          s.id,
          s.roadmapId,
          s.stageNumber,
          s.name,
          s.slug,
          s.bandRange,
          s.description,
          s.iconName,
          s.accentColor,
          s.requiredKnownPercent,
          s.requiredQuizScore,
          s.sortOrder,
        ]
      );
    }
    console.log("✓ Seeded stages for both tracks");

    // =========================================================
    // 3. MAP TOPICS INTO VOCABULARY STAGES
    // =========================================================
    // Lấy danh sách topics hiện có để phân bổ vào 4 chặng từ vựng
    const existingTopicsRes = await client.query(
      `SELECT id, name FROM topics WHERE is_visible = true AND deleted_at IS NULL ORDER BY created_at ASC;`
    );
    const existingTopics = existingTopicsRes.rows;

    if (existingTopics.length > 0) {
      const chunkSize = Math.ceil(existingTopics.length / 4);
      for (let i = 0; i < existingTopics.length; i++) {
        const topic = existingTopics[i];
        const stageIdx = Math.min(3, Math.floor(i / chunkSize));
        const stageId = vocabStages[stageIdx].id;

        await client.query(
          `
          INSERT INTO roadmap_stage_topics (stage_id, topic_id, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (stage_id, topic_id) DO NOTHING;
        `,
          [stageId, topic.id, i + 1]
        );
      }
      console.log(`✓ Mapped ${existingTopics.length} topics into 4 vocabulary stages`);
    }

    // =========================================================
    // 4. SEED GRAMMAR LESSONS & EXERCISES
    // =========================================================
    const grammarLessonsData = [
      // Stage 1 Lessons
      {
        id: "lesson-tenses",
        stageId: "stage-grammar-1",
        title: "Các thì cốt lõi trong IELTS Writing & Speaking",
        slug: "cac-thi-cot-loi-trong-ielts",
        targetBand: "4.5 - 5.5",
        summary: "Nắm vững cách phối thì Hiện tại hoàn thành, Quá khứ đơn và Hiện tại đơn để miêu tả dữ liệu Task 1 và kể chuyện Task 2.",
        theoryMarkdown: `### 1. Hiện tại đơn (Present Simple)
- **Công thức**: \`S + V(s/es) + O\`
- **Ứng dụng IELTS**: Nêu lên sự thật hiển nhiên, quan điểm chung của xã hội trong Task 2.
- **Ví dụ**: *Many people believe that technological advancement improves our standard of living.*

### 2. Quá khứ đơn (Past Simple)
- **Công thức**: \`S + V2/ed + O\`
- **Ứng dụng IELTS**: Bắt buộc dùng trong Writing Task 1 khi biểu đồ có mốc thời gian quá khứ (ví dụ: *Between 2000 and 2015*).
- **Ví dụ**: *The consumption of renewable energy increased dramatically in 2010.*

### 3. Hiện tại hoàn thành (Present Perfect)
- **Công thức**: \`S + have/has + V3/ed + O\`
- **Ứng dụng IELTS**: Miêu tả xu hướng bắt đầu trong quá khứ kéo dài đến hiện tại hoặc hệ quả hiện nay.
- **Ví dụ**: *The number of private vehicles has risen significantly over the past decade.*`,
        tips: "Trong Writing Task 1, nếu biểu đồ không ghi năm, hãy mặc định dùng Hiện tại đơn. Nếu có khoảng thời gian kết thúc ở quá khứ, hãy dùng Quá khứ đơn.",
        estimatedMinutes: 20,
        sortOrder: 1,
        exercises: [
          {
            question: "Between 1995 and 2010, the proportion of elderly people in Japan ______ by 15%.",
            questionType: "multiple_choice" as const,
            options: ["increased", "has increased", "increases", "is increasing"],
            correctAnswer: "increased",
            explanation: "Vì khoảng thời gian 'Between 1995 and 2010' là một mốc thời gian đã kết thúc hoàn toàn trong quá khứ, ta bắt buộc sử dụng thì Quá khứ đơn (increased).",
          },
          {
            question: "Over the last twenty years, urbanisation ______ serious environmental challenges for major cities.",
            questionType: "multiple_choice" as const,
            options: ["created", "has created", "is creating", "will create"],
            correctAnswer: "has created",
            explanation: "Cụm từ 'Over the last twenty years' (trong suốt 20 năm qua) chỉ hành động bắt đầu trong quá khứ kéo dài đến hiện tại, do đó dùng Hiện tại hoàn thành (has created).",
          },
        ],
      },
      {
        id: "lesson-sentence-structures",
        stageId: "stage-grammar-1",
        title: "Câu đơn, câu ghép và câu phức chuẩn IELTS",
        slug: "cau-don-cau-ghep-cau-phuc",
        targetBand: "5.0 - 5.5",
        summary: "Phân biệt mệnh đề độc lập và phụ thuộc, sử dụng liên từ FANBOYS và liên từ phụ thuộc để câu văn mượt mà.",
        theoryMarkdown: `### 1. Câu ghép (Compound Sentences)
- Kết hợp 2 mệnh đề độc lập bằng liên từ đẳng lập: **FANBOYS** (*For, And, Nor, But, Or, Yet, So*).
- Luôn có dấu phẩy trước liên từ: \`Mệnh đề 1, [FANBOYS] mệnh đề 2.\`
- **Ví dụ**: *Public transport is affordable, but many commuters still prefer personal vehicles.*

### 2. Câu phức (Complex Sentences)
- Gồm 1 mệnh đề độc lập + ít nhất 1 mệnh đề phụ thuộc (bắt đầu bằng *Although, Because, While, Since, Whereas...*).
- **Quy tắc dấu phẩy**: Nếu mệnh đề phụ thuộc đứng đầu, phải có dấu phẩy ngăn cách.
- **Ví dụ**: *Although governments have implemented strict emission standards, air pollution continues to rise.*`,
        tips: "Để đạt Band 6.0+ Grammatical Range, bài viết cần có sự kết hợp hài hòa giữa câu đơn, câu ghép và câu phức. Không nên lạm dụng quá nhiều câu đơn ngắn cộc lốc.",
        estimatedMinutes: 20,
        sortOrder: 2,
        exercises: [
          {
            question: "______ public transport is widely available in European capitals, many citizens choose to cycle to reduce carbon footprints.",
            questionType: "multiple_choice" as const,
            options: ["Although", "However", "Because", "Despite"],
            correctAnswer: "Although",
            explanation: "'Although' là liên từ phụ thuộc theo sau bởi một mệnh đề (S + V) mang nghĩa nhượng bộ (Mặc dù...). 'Despite' đi với danh từ/V-ing, còn 'However' là trạng từ liên kết.",
          },
        ],
      },
      // Stage 2 Lessons
      {
        id: "lesson-relative-clauses",
        stageId: "stage-grammar-2",
        title: "Mệnh đề quan hệ & Mẹo tránh lỗi dấu phẩy",
        slug: "menh-de-quan-he-ielts",
        targetBand: "5.5 - 6.5",
        summary: "Sử dụng Who, Which, That, Whose và Where để cung cấp thông tin chi tiết cho danh từ mà không bị lặp từ.",
        theoryMarkdown: `### 1. Mệnh đề quan hệ xác định (Defining)
- Cung cấp thông tin thiết yếu để xác định danh từ đứng trước. **Không có dấu phẩy**. Có thể dùng *That*.
- **Ví dụ**: *Students who participate in extracurricular activities often develop stronger leadership skills.*

### 2. Mệnh đề quan hệ không xác định (Non-defining)
- Cung cấp thêm thông tin phụ cho danh từ đã được xác định cụ thể. **Bắt buộc có dấu phẩy**. **Không dùng That**.
- **Ví dụ**: *Solar energy, which is completely renewable, has become increasingly cost-effective.*

### 3. Sử dụng "Which" để bổ nghĩa cho cả mệnh đề phía trước
- Đây là cấu trúc học thuật rất được ưa chuộng trong Task 2 để nêu hệ quả.
- **Ví dụ**: *Many children spend hours on smartphones, which diminishes their concentration span.*`,
        tips: "Nhớ quy tắc vàng: Tuyệt đối không bao giờ dùng 'that' ngay sau dấu phẩy trong mệnh đề quan hệ!",
        estimatedMinutes: 25,
        sortOrder: 1,
        exercises: [
          {
            question: "Electric cars produce zero tailpipe emissions, ______ significantly improves urban air quality.",
            questionType: "multiple_choice" as const,
            options: ["which", "that", "what", "where"],
            correctAnswer: "which",
            explanation: "Dùng đại từ quan hệ ', which' để thay thế và bổ nghĩa cho toàn bộ mệnh đề đứng trước ('Electric cars produce zero tailpipe emissions') chỉ kết quả, không dùng 'that' sau dấu phẩy.",
          },
        ],
      },
      {
        id: "lesson-passive-voice",
        stageId: "stage-grammar-2",
        title: "Câu bị động học thuật (Academic Passive Voice)",
        slug: "cau-bi-dong-hoc-thuat",
        targetBand: "6.0 - 6.5",
        summary: "Tạo giọng văn khách quan, học thuật bằng cách đưa tân ngữ lên làm chủ ngữ và cấu trúc It is believed that...",
        theoryMarkdown: `### 1. Câu bị động cơ bản
- **Công thức**: \`S + be + V3/ed + (by O)\`
- Thường dùng trong Writing Task 1 miêu tả quy trình sản xuất (Process Diagram) hoặc khi không cần nhấn mạnh người thực hiện hành động.
- **Ví dụ**: *The raw tea leaves are harvested, washed and subsequently dried.*

### 2. Cấu trúc bị động khách quan (Impersonal Passive)
- Rất phổ biến khi mở bài hoặc đưa quan điểm đối lập trong Writing Task 2:
  - *It is widely believed that...* (Nhiều người tin rằng...)
  - *It is often argued that...* (Thường có ý kiến cho rằng...)
  - *S + is considered to be...* (Được coi là...)
- **Ví dụ**: *It is widely acknowledged that continuous professional development is vital for career progression.*`,
        tips: "Trong bài viết học thuật, hạn chế dùng 'People say that...' hoặc 'I think that...'. Hãy thay bằng 'It is asserted that...' hoặc 'It is argued that...' để tăng tính khách quan.",
        estimatedMinutes: 25,
        sortOrder: 2,
        exercises: [
          {
            question: "It is widely ______ that artificial intelligence will transform medical diagnostics in the coming decades.",
            questionType: "multiple_choice" as const,
            options: ["acknowledged", "acknowledge", "acknowledging", "acknowledges"],
            correctAnswer: "acknowledged",
            explanation: "Cấu trúc bị động khách quan học thuật: 'It is widely acknowledged that + mệnh đề' (Mọi người đều công nhận rằng...).",
          },
        ],
      },
      // Stage 3 Lessons
      {
        id: "lesson-inversion",
        stageId: "stage-grammar-3",
        title: "Cấu trúc Đảo ngữ nhấn mạnh (Inversion for Emphasis)",
        slug: "cau-truc-dao-ngu-nhan-manh",
        targetBand: "7.0 - 8.0+",
        summary: "Vận dụng các cấu trúc Not only, Only by, Seldom để tạo ấn tượng mạnh về sự đa dạng ngữ pháp trong Writing Task 2.",
        theoryMarkdown: `### 1. Đảo ngữ với trạng từ phủ định (Negative Adverbials)
- Đưa trạng từ phủ định lên đầu câu -> Đảo trợ động từ trước chủ ngữ:
  - \`Not only + Trợ động từ + S + V, but S also...\`
  - \`Seldom / Rarely + Trợ động từ + S + V...\`
- **Ví dụ**: *Not only does tourism generate substantial tax revenue, but it also creates employment opportunities for local residents.*

### 2. Đảo ngữ với "Only by" / "Only when"
- \`Only by + V-ing + Trợ động từ + S + V...\` (Chỉ bằng cách... thì mới có thể...)
- **Ví dụ**: *Only by implementing stricter penalties can the government deter illegal wildlife trade.*

### 3. Đảo ngữ điều kiện (Inverted Conditionals)
- Loại bỏ 'If':
  - *Should students face difficulties...* (thay cho *If students face...*)
  - *Were governments to invest more...* (thay cho *If governments invested...*)
  - *Had the committee acted sooner...* (thay cho *If the committee had acted...*)`,
        tips: "Chỉ nên dùng 1-2 câu đảo ngữ trong bài Writing Task 2. Dùng quá nhiều sẽ khiến bài văn bị gượng gạo và thiếu tự nhiên.",
        estimatedMinutes: 30,
        sortOrder: 1,
        exercises: [
          {
            question: "Not only ______ contribute to global warming, but it also depletes irreplaceable natural habitats.",
            questionType: "multiple_choice" as const,
            options: ["does deforestation", "deforestation does", "is deforestation", "deforestation is"],
            correctAnswer: "does deforestation",
            explanation: "Khi cụm từ phủ định 'Not only' đứng đầu câu, ta phải áp dụng cấu trúc đảo ngữ: mượn trợ động từ 'does' đặt trước chủ ngữ 'deforestation' + động từ nguyên thể 'contribute'.",
          },
          {
            question: "Only by investing heavily in renewable energy ______ reduce carbon emissions effectively.",
            questionType: "multiple_choice" as const,
            options: ["can nations", "nations can", "nations will", "do nations can"],
            correctAnswer: "can nations",
            explanation: "Sau cụm 'Only by + V-ing', mệnh đề chính phải đảo trợ động từ 'can' lên trước chủ ngữ 'nations'.",
          },
        ],
      },
      {
        id: "lesson-nominalisation",
        stageId: "stage-grammar-3",
        title: "Danh từ hóa (Nominalisation) trong Academic Writing",
        slug: "danh-tu-hoa-nominalisation",
        targetBand: "7.0 - 8.5",
        summary: "Biến đổi động từ và tính từ thành cụm danh từ để bài viết súc tích, mang đậm phong cách văn phong học thuật C1/C2.",
        theoryMarkdown: `### 1. Danh từ hóa là gì?
- Nominalisation là kỹ thuật chuyển đổi động từ hoặc tính từ thành danh từ tương ứng.
- **So sánh**:
  - *Thông thường*: Crime increases because people are unemployed.
  - *Học thuật (Nominalised)*: The surge in unemployment has led to an escalation in crime rates.

### 2. Lợi ích vượt trội trong IELTS Writing
1. Giúp câu văn cô đọng, giàu mật độ thông tin (lexical density).
2. Tạo cảm giác khách quan, chuyên nghiệp như các bài nghiên cứu khoa học.
3. Dễ dàng sử dụng các động từ nguyên nhân - kết quả học thuật như *lead to, stem from, trigger, contribute to*.`,
        tips: "Kỹ năng danh từ hóa chính là chìa khóa then chốt phân biệt giữa bài viết Band 6.0 và bài viết Band 7.5+.",
        estimatedMinutes: 25,
        sortOrder: 2,
        exercises: [
          {
            question: "Rewrite/Identify the nominalised version: 'Because the climate is changing rapidly, sea levels are rising.'",
            questionType: "multiple_choice" as const,
            options: [
              "Rapid climate change has triggered a dramatic rise in sea levels.",
              "The climate changes so fast that sea levels rise up.",
              "Because climate change is rapid, so the sea rises.",
              "Sea levels rise because of fast climate change.",
            ],
            correctAnswer: "Rapid climate change has triggered a dramatic rise in sea levels.",
            explanation: "Câu 'Rapid climate change has triggered a dramatic rise in sea levels' sử dụng danh từ hóa 'rapid climate change' và 'rise in sea levels' kết hợp động từ học thuật 'triggered', đạt chuẩn phong cách C1/C2.",
          },
        ],
      },
    ];

    for (const l of grammarLessonsData) {
      await client.query(
        `
        INSERT INTO grammar_lessons (id, stage_id, title, slug, target_band, summary, theory_markdown, tips, estimated_minutes, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          theory_markdown = EXCLUDED.theory_markdown,
          tips = EXCLUDED.tips,
          sort_order = EXCLUDED.sort_order;
      `,
        [
          l.id,
          l.stageId,
          l.title,
          l.slug,
          l.targetBand,
          l.summary,
          l.theoryMarkdown,
          l.tips,
          l.estimatedMinutes,
          l.sortOrder,
        ]
      );

      // Seed exercises for this lesson
      let exerciseOrder = 1;
      for (const ex of l.exercises) {
        await client.query(
          `
          INSERT INTO grammar_exercises (lesson_id, question, question_type, options, correct_answer, explanation, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
          [
            l.id,
            ex.question,
            ex.questionType,
            JSON.stringify(ex.options),
            ex.correctAnswer,
            ex.explanation,
            exerciseOrder++,
          ]
        );
      }
    }
    console.log(`✓ Seeded ${grammarLessonsData.length} grammar lessons with interactive exercises`);

    // =========================================================
    // 5. SEED PRACTICE & MOCK TESTS (STUDY4 STYLE)
    // =========================================================
    // Test 1: Full Diagnostic Placement Test (40 questions, 30 mins)
    await client.query(`
      INSERT INTO tests (id, title, slug, category, target_band, duration_minutes, total_questions, passing_score_percent, description, is_published)
      VALUES 
      (
        'test-placement-01',
        'IELTS Diagnostic Placement Test 01 (Khảo sát Trình độ Đầu vào)',
        'ielts-diagnostic-placement-test-01',
        'placement',
        '4.0 - 8.5',
        30,
        20,
        60,
        'Bài khảo sát đánh giá trình độ năng lực tổng hợp gồm Từ vựng học thuật, Ngữ pháp câu phức và Kỹ năng phân tích ngữ cảnh chuẩn format IELTS.',
        true
      ),
      (
        'test-mini-vocab-awl',
        'Mini-Test: Chinh phục Từ vựng Học thuật AWL Cốt lõi',
        'mini-test-tu-vung-awl',
        'mini_test',
        '6.0 - 7.5',
        15,
        10,
        70,
        'Bài kiểm tra nhanh 15 phút tập trung vào các Collocations và Academic Word List thường gặp nhất trong đề thi IELTS gần đây.',
        true
      ),
      (
        'test-mini-grammar-advanced',
        'Mini-Test: Ngữ pháp Câu phức & Cấu trúc Nâng cao',
        'mini-test-ngu-phap-nang-cao',
        'mini_test',
        '6.5 - 8.0',
        15,
        10,
        75,
        'Rèn luyện kỹ năng xử lý Đảo ngữ, Mệnh đề quan hệ, Câu bị động đặc biệt và Cleft sentences dưới áp lực thời gian.',
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        total_questions = EXCLUDED.total_questions,
        duration_minutes = EXCLUDED.duration_minutes,
        passing_score_percent = EXCLUDED.passing_score_percent;
    `);

    // Seed questions for Placement Test
    const placementQuestions = [
      {
        testId: "test-placement-01",
        partNumber: 1,
        contextText: "Chọn từ/cụm từ đúng nhất để hoàn chỉnh câu văn theo ngữ cảnh học thuật IELTS.",
        questionText: "The local government has decided to ______ substantial funds to the development of eco-friendly transport infrastructure.",
        questionType: "multiple_choice" as const,
        options: ["allocate", "distribute", "scatter", "dispose"],
        correctAnswer: "allocate",
        explanation: "Collocation học thuật: 'allocate funds/resources to something' (phân bổ ngân sách/nguồn lực cho cái gì). 'Distribute' mang nghĩa phân phát, 'scatter' là rải rác, 'dispose' là vứt bỏ.",
        sortOrder: 1,
      },
      {
        testId: "test-placement-01",
        partNumber: 1,
        contextText: null,
        questionText: "Rapid urbanisation has placed an unprecedented strain ______ municipal water and sanitation facilities.",
        questionType: "multiple_choice" as const,
        options: ["on", "with", "for", "at"],
        correctAnswer: "on",
        explanation: "Collocation cố định: 'place/put a strain ON something' (đặt gánh nặng/áp lực lớn lên cái gì).",
        sortOrder: 2,
      },
      {
        testId: "test-placement-01",
        partNumber: 1,
        contextText: null,
        questionText: "It is widely acknowledged that excessive reliance on fossil fuels poses a serious threat to environmental ______.",
        questionType: "multiple_choice" as const,
        options: ["sustainability", "sustenance", "sustainable", "sustainably"],
        correctAnswer: "sustainability",
        explanation: "Sau tính từ 'environmental' cần một danh từ. 'Sustainability' (sự bền vững môi trường). 'Sustenance' là chất bổ dưỡng/thực phẩm.",
        sortOrder: 3,
      },
      {
        testId: "test-placement-01",
        partNumber: 1,
        contextText: null,
        questionText: "The survey reveals that consumer spending has plummeted, ______ is a clear indication of economic downturn.",
        questionType: "multiple_choice" as const,
        options: ["which", "that", "what", "where"],
        correctAnswer: "which",
        explanation: "Mệnh đề quan hệ không xác định đứng sau dấu phẩy bổ nghĩa cho toàn bộ sự việc ở mệnh đề trước ('consumer spending has plummeted') bắt buộc dùng 'which'.",
        sortOrder: 4,
      },
      {
        testId: "test-placement-01",
        partNumber: 1,
        contextText: null,
        questionText: "Rarely ______ such rapid progress in biotechnology as we have witnessed over the past few decades.",
        questionType: "multiple_choice" as const,
        options: ["has humanity achieved", "humanity has achieved", "did humanity achieved", "humanity achieved"],
        correctAnswer: "has humanity achieved",
        explanation: "Đảo ngữ với trạng từ tần suất phủ định 'Rarely' đứng đầu câu: Trợ động từ 'has' + S 'humanity' + V3 'achieved'.",
        sortOrder: 5,
      },
      {
        testId: "test-placement-01",
        partNumber: 2,
        contextText: "Đọc đoạn văn ngắn sau và trả lời các câu hỏi: \n\n'In recent years, the integration of artificial intelligence into primary healthcare has sparked intense debate among medical practitioners. Proponents argue that machine-learning algorithms can process clinical diagnostics at an unprecedented velocity, significantly mitigating diagnostic oversights. Conversely, sceptics caution that an over-dependence on automated systems may erode empathetic patient-doctor communication, which remains indispensable to holistic patient recovery.'",
        questionText: "According to the passage, advocates of artificial intelligence in healthcare highlight its ability to:",
        questionType: "multiple_choice" as const,
        options: [
          "Enhance the speed and accuracy of medical diagnoses",
          "Completely replace human general practitioners",
          "Strengthen empathy in clinical consultations",
          "Lower the cost of specialized pharmaceutical drugs",
        ],
        correctAnswer: "Enhance the speed and accuracy of medical diagnoses",
        explanation: "Đoạn văn nêu: 'Proponents argue that machine-learning algorithms can process clinical diagnostics at an unprecedented velocity, significantly mitigating diagnostic oversights' (tốc độ chưa từng có và giảm thiểu sai sót chẩn đoán) tương đương 'Enhance the speed and accuracy of medical diagnoses'.",
        sortOrder: 6,
      },
      {
        testId: "test-placement-01",
        partNumber: 2,
        contextText: null,
        questionText: "The word 'indispensable' in the excerpt is closest in meaning to:",
        questionType: "multiple_choice" as const,
        options: ["essential", "optional", "negligible", "superficial"],
        correctAnswer: "essential",
        explanation: "'Indispensable' có nghĩa là không thể thiếu được, thiết yếu, đồng nghĩa với 'essential'. 'Optional' là tùy ý, 'negligible' là không đáng kể, 'superficial' là nông cạn/hời hợt.",
        sortOrder: 7,
      },
      {
        testId: "test-placement-01",
        partNumber: 2,
        contextText: null,
        questionText: "Which of the following describes the main concern expressed by sceptics?",
        questionType: "multiple_choice" as const,
        options: [
          "The degradation of emotional connection between doctors and patients",
          "The exorbitant expense of installing software",
          "The difficulty in training elderly healthcare workers",
          "The legal liabilities of algorithmic miscalculations",
        ],
        correctAnswer: "The degradation of emotional connection between doctors and patients",
        explanation: "Bài đọc nêu: 'caution that an over-dependence on automated systems may erode empathetic patient-doctor communication' (làm xói mòn sự giao tiếp thấu cảm giữa bệnh nhân và bác sĩ) -> chính là sự suy giảm kết nối cảm xúc (degradation of emotional connection).",
        sortOrder: 8,
      },
      {
        testId: "test-placement-01",
        partNumber: 3,
        contextText: "Chọn phương án viết lại câu đạt phong cách học thuật cao nhất (Academic Register).",
        questionText: "Original: 'People use too much plastic, so our oceans are getting dirtier and dirtier.'",
        questionType: "multiple_choice" as const,
        options: [
          "The excessive consumption of single-use plastics has precipitated widespread marine degradation.",
          "Because people consume a lot of plastics, oceans are very dirty.",
          "Plastic usage is huge and it makes oceans dirtier day after day.",
          "Oceans are becoming dirtier because too much plastic is dumped by citizens.",
        ],
        correctAnswer: "The excessive consumption of single-use plastics has precipitated widespread marine degradation.",
        explanation: "Câu 'The excessive consumption of single-use plastics has precipitated widespread marine degradation' áp dụng kỹ thuật danh từ hóa xuất sắc ('excessive consumption', 'marine degradation') và động từ học thuật C1 'precipitated' (gây ra/thúc đẩy).",
        sortOrder: 9,
      },
      {
        testId: "test-placement-01",
        partNumber: 3,
        contextText: null,
        questionText: "Had the municipal authorities enforced stricter zoning regulations, urban sprawl ______ mitigated effectively.",
        questionType: "multiple_choice" as const,
        options: ["would have been", "would be", "will be", "had been"],
        correctAnswer: "would have been",
        explanation: "Cấu trúc đảo ngữ câu điều kiện loại 3: 'Had + S + V3, S + would have been + V3' diễn tả điều kiện trái với thực tế trong quá khứ.",
        sortOrder: 10,
      },
    ];

    // Xóa câu hỏi cũ của test-placement-01 nếu có và thêm lại
    await client.query(`DELETE FROM test_questions WHERE test_id = 'test-placement-01';`);
    for (const q of placementQuestions) {
      await client.query(
        `
        INSERT INTO test_questions (test_id, part_number, context_text, question_text, question_type, options, correct_answer, explanation, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
        [
          q.testId,
          q.partNumber,
          q.contextText,
          q.questionText,
          q.questionType,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.explanation,
          q.sortOrder,
        ]
      );
    }

    // Seed questions for Mini Vocab Test
    const miniVocabQuestions = [
      {
        testId: "test-mini-vocab-awl",
        partNumber: 1,
        contextText: null,
        questionText: "The researcher provided ______ empirical evidence to corroborate her hypothesis.",
        questionType: "multiple_choice" as const,
        options: ["compelling", "compelled", "compulsion", "compulsively"],
        correctAnswer: "compelling",
        explanation: "Collocation học thuật: 'compelling empirical evidence' (bằng chứng thực nghiệm thuyết phục).",
        sortOrder: 1,
      },
      {
        testId: "test-mini-vocab-awl",
        partNumber: 1,
        contextText: null,
        questionText: "Technological innovation has fostered greater economic ______ among developing nations.",
        questionType: "multiple_choice" as const,
        options: ["interdependence", "isolation", "discrepancy", "deterioration"],
        correctAnswer: "interdependence",
        explanation: "'Economic interdependence' (sự phụ thuộc lẫn nhau về kinh tế giữa các quốc gia trong xu thế toàn cầu hóa).",
        sortOrder: 2,
      },
      {
        testId: "test-mini-vocab-awl",
        partNumber: 1,
        contextText: null,
        questionText: "The new tax policy aims to ______ disparities in household income distribution.",
        questionType: "multiple_choice" as const,
        options: ["mitigate", "exacerbate", "perpetuate", "reiterate"],
        correctAnswer: "mitigate",
        explanation: "'Mitigate disparities' (giảm thiểu sự chênh lệch/bất bình đẳng). 'Exacerbate' là làm trầm trọng thêm, 'perpetuate' là duy trì lâu dài, 'reiterate' là nhắc lại.",
        sortOrder: 3,
      },
    ];

    await client.query(`DELETE FROM test_questions WHERE test_id = 'test-mini-vocab-awl';`);
    for (const q of miniVocabQuestions) {
      await client.query(
        `
        INSERT INTO test_questions (test_id, part_number, context_text, question_text, question_type, options, correct_answer, explanation, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
        [
          q.testId,
          q.partNumber,
          q.contextText,
          q.questionText,
          q.questionType,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.explanation,
          q.sortOrder,
        ]
      );
    }

    // Seed questions for Mini Grammar Test
    const miniGrammarQuestions = [
      {
        testId: "test-mini-grammar-advanced",
        partNumber: 1,
        contextText: null,
        questionText: "______ with insufficient funding, the public hospital struggled to upgrade its intensive care equipment.",
        questionType: "multiple_choice" as const,
        options: ["Faced", "Facing", "Having faced", "To face"],
        correctAnswer: "Faced",
        explanation: "Rút gọn mệnh đề phân từ quá khứ mang nghĩa bị động: 'Faced with...' = 'Because it was faced with...'.",
        sortOrder: 1,
      },
      {
        testId: "test-mini-grammar-advanced",
        partNumber: 1,
        contextText: null,
        questionText: "It was the lack of infrastructure ______ hindered the delivery of humanitarian aid to the remote villages.",
        questionType: "multiple_choice" as const,
        options: ["that", "which", "where", "what"],
        correctAnswer: "that",
        explanation: "Cấu trúc câu chẻ nhấn mạnh (Cleft sentence): 'It was + Tân ngữ/Chủ ngữ + THAT + V'.",
        sortOrder: 2,
      },
    ];

    await client.query(`DELETE FROM test_questions WHERE test_id = 'test-mini-grammar-advanced';`);
    for (const q of miniGrammarQuestions) {
      await client.query(
        `
        INSERT INTO test_questions (test_id, part_number, context_text, question_text, question_type, options, correct_answer, explanation, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
        [
          q.testId,
          q.partNumber,
          q.contextText,
          q.questionText,
          q.questionType,
          JSON.stringify(q.options),
          q.correctAnswer,
          q.explanation,
          q.sortOrder,
        ]
      );
    }

    // Cập nhật lại số lượng câu hỏi thực tế trong bảng tests
    await client.query(`
      UPDATE tests SET total_questions = (SELECT count(*) FROM test_questions WHERE test_id = tests.id);
    `);

    await client.query("COMMIT");
    console.log("✓ All IELTS Roadmap, Grammar and Test Hub data seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedRoadmapData();

