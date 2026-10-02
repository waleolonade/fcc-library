<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GoogleBook;

class GoogleBooksSeeder extends Seeder
{
    public function run(): void
    {
        $books = [
            [
                'volume_id'               => 'Py8u3Obs4f4C',
                'title'                   => 'Mountain View',
                'subtitle'                => 'Images of America',
                'authors'                 => ['Nicholas Perry'],
                'publisher'               => 'Arcadia Publishing',
                'published_date'          => '2005',
                'description'             => 'Historic overview and development of technological infrastructures, computing centers, and modern knowledge institutions.',
                'isbn_10'                 => '0738531367',
                'isbn_13'                 => '9780738531366',
                'page_count'              => 128,
                'categories'              => ['History / United States / State & Local'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=Py8u3Obs4f4C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                'preview_link'            => 'https://books.google.com/books?id=Py8u3Obs4f4C&printsec=frontcover',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Technology & Institutional History',
                'recommendation_notes'    => 'Official Google Embedded Viewer reference work showcasing interactive JavaScript book embedding.'
            ],
            [
                'volume_id'               => 'zyTCAlFPjgYC',
                'title'                   => 'The Google Story',
                'subtitle'                => 'Inside the Hottest Business, Media, and Technology Success of Our Time',
                'authors'                 => ['David A. Vise', 'Mark Malseed'],
                'publisher'               => 'Random House Digital, Inc.',
                'published_date'          => '2005-11-15',
                'description'             => 'The comprehensive history of digital knowledge indexing, algorithmic information retrieval, and internet enterprise architecture.',
                'isbn_10'                 => '055380457X',
                'isbn_13'                 => '9780553804577',
                'page_count'              => 207,
                'categories'              => ['Business & Economics / Entrepreneurship', 'Computers / Web Services'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=zyTCAlFPjgYC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                'preview_link'            => 'https://books.google.com/books?id=zyTCAlFPjgYC&printsec=frontcover',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Computer Science & Information Retrieval',
                'recommendation_notes'    => 'Essential reading for enterprise digital systems, data structuring, and search engine mechanics.'
            ],
            [
                'volume_id'               => '1yU0AgAAQBAJ',
                'title'                   => 'Co-operative Enterprise',
                'subtitle'                => 'Managing People, Ownership and Governance',
                'authors'                 => ['Tom Webb', 'Peter Couchman'],
                'publisher'               => 'Routledge',
                'published_date'          => '2016-04-15',
                'description'             => 'Comprehensive textbook on cooperative governance, member capital formation, and enterprise sustainability.',
                'isbn_10'                 => '1138924087',
                'isbn_13'                 => '9781138924086',
                'page_count'              => 256,
                'categories'              => ['Business & Economics / Co-operatives'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=1yU0AgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                'preview_link'            => 'https://books.google.com/books?id=1yU0AgAAQBAJ&printsec=frontcover',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Cooperative Economics & Management',
                'recommendation_notes'    => 'Core textbook for Cooperative Economics & Management (CEM) ND and HND curricula.'
            ],
            [
                'volume_id'               => 's3yvDwAAQBAJ',
                'title'                   => 'Agricultural Economics and Agribusiness',
                'subtitle'                => 'Eighth Edition',
                'authors'                 => ['Gail L. Cramer', 'Clarence W. Jensen', 'Douglas D. Southgate'],
                'publisher'               => 'Wiley',
                'published_date'          => '2018',
                'description'             => 'Foundational economic principles applied to agricultural production, farm management, commodity markets, and rural agribusiness.',
                'isbn_10'                 => '1119565575',
                'isbn_13'                 => '9781119565574',
                'page_count'              => 520,
                'categories'              => ['Business & Economics / Agricultural'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=s3yvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                'preview_link'            => 'https://books.google.com/books?id=s3yvDwAAQBAJ&printsec=frontcover',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Agricultural Economics & Farm Management',
                'recommendation_notes'    => 'Standard departmental textbook for Agricultural Technology (AGT) students.'
            ],
            [
                'volume_id'               => 'k3_gAQAAMAAJ',
                'title'                   => 'The Art of Computer Programming: Fundamental Algorithms',
                'subtitle'                => 'Volume 1, Third Edition',
                'authors'                 => ['Donald E. Knuth'],
                'publisher'               => 'Addison-Wesley Professional',
                'published_date'          => '1997',
                'description'             => 'The definitive, foundational work on algorithms, data structures, and computational mathematics.',
                'isbn_10'                 => '0201896834',
                'isbn_13'                 => '9780201896831',
                'page_count'              => 650,
                'categories'              => ['Computers / Programming / Algorithms'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=k3_gAQAAMAAJ&printsec=frontcover&img=1&zoom=1',
                'preview_link'            => 'https://books.google.com/books?id=k3_gAQAAMAAJ',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Computer Science & Software Engineering',
                'recommendation_notes'    => 'Canonical algorithm textbook required for HND Computer Science candidates.'
            ],
            [
                'volume_id'               => 'uE_ZDwAAQBAJ',
                'title'                   => 'Python for Data Analysis',
                'subtitle'                => 'Data Wrangling with Pandas, NumPy, and Jupyter',
                'authors'                 => ['Wes McKinney'],
                'publisher'               => 'O\'Reilly Media',
                'published_date'          => '2022',
                'description'             => 'Comprehensive guide to scientific computing, database analysis, and data engineering using Python.',
                'isbn_10'                 => '109810403X',
                'isbn_13'                 => '9781098104030',
                'page_count'              => 550,
                'categories'              => ['Computers / Data Science / Python'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=uE_ZDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
                'preview_link'            => 'https://books.google.com/books?id=uE_ZDwAAQBAJ',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Data Science & Applied Computing',
                'recommendation_notes'    => 'Core practical text for ND and HND Python programming courses.'
            ],
            [
                'volume_id'               => '7lF1EAAAQBAJ',
                'title'                   => 'Artificial Intelligence: A Modern Approach',
                'subtitle'                => 'Fourth Edition',
                'authors'                 => ['Stuart Russell', 'Peter Norvig'],
                'publisher'               => 'Pearson',
                'published_date'          => '2020',
                'description'             => 'The leading textbook in Artificial Intelligence used in over 1,500 universities worldwide.',
                'isbn_10'                 => '0134610997',
                'isbn_13'                 => '9780134610993',
                'page_count'              => 1166,
                'categories'              => ['Computers / Artificial Intelligence'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=7lF1EAAAQBAJ&printsec=frontcover&img=1&zoom=1',
                'preview_link'            => 'https://books.google.com/books?id=7lF1EAAAQBAJ',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Artificial Intelligence & Robotics',
                'recommendation_notes'    => 'Standard curriculum text for modern AI, intelligent agents, and machine learning.'
            ],
            [
                'volume_id'               => 'N9rRAgAAQBAJ',
                'title'                   => 'Principles of Agronomy and Crop Production',
                'subtitle'                => 'Sustainable Agricultural Science',
                'authors'                 => ['S. R. Reddy'],
                'publisher'               => 'Kalyani Publishers',
                'published_date'          => '2019',
                'description'             => 'Exhaustive textbook covering soil mechanics, crop ecology, irrigation systems, and sustainable farming.',
                'isbn_10'                 => '9327299042',
                'isbn_13'                 => '9789327299045',
                'page_count'              => 670,
                'categories'              => ['Technology & Engineering / Agriculture / Agronomy'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=N9rRAgAAQBAJ&printsec=frontcover&img=1&zoom=1',
                'preview_link'            => 'https://books.google.com/books?id=N9rRAgAAQBAJ',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Agricultural Technology & Crop Science',
                'recommendation_notes'    => 'Required reading for AGT 211 Crop Production and Agronomy practicals.'
            ],
            [
                'volume_id'               => 'a4_3DwAAQBAJ',
                'title'                   => 'Commercial Bank Financial Management',
                'subtitle'                => 'In the Financial-Services Industry',
                'authors'                 => ['Joseph F. Sinkey Jr.'],
                'publisher'               => 'Prentice Hall',
                'published_date'          => '2002',
                'description'             => 'Authoritative analysis of commercial banking operations, credit risk management, and capital liquidity.',
                'isbn_10'                 => '0130909107',
                'isbn_13'                 => '9780130909107',
                'page_count'              => 780,
                'categories'              => ['Business & Economics / Banks & Banking'],
                'thumbnail_url'           => 'https://books.google.com/books/content?id=a4_3DwAAQBAJ&printsec=frontcover&img=1&zoom=1',
                'preview_link'            => 'https://books.google.com/books?id=a4_3DwAAQBAJ',
                'viewability'             => 'PARTIAL',
                'embeddable'              => true,
                'is_recommended'          => true,
                'recommendation_category' => 'Banking & Finance',
                'recommendation_notes'    => 'Essential textbook for BF 311 Commercial Banking Operations.'
            ]
        ];

        foreach ($books as $data) {
            GoogleBook::updateOrCreate(
                ['volume_id' => $data['volume_id']],
                $data
            );
        }
    }
}
