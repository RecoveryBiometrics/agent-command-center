/**
 * Fill Missing History — Adds history entries for cities where Wikipedia
 * scraping didn't find a History section.
 *
 * Uses curated historical data for each city based on known facts.
 * Only modifies files where history array is empty.
 *
 * Usage: node scripts/wiki-generator/fill-missing-history.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../src/data/city-wiki');

// Curated history data for cities missing Wikipedia history sections
const HISTORY_DATA = {
  'aldan': {
    founded: '1893',
    population: '4,244',
    history: [
      { era: 'Victorian Origins', title: 'Borough Founding', description: 'Aldan was incorporated as a borough in 1893 from portions of Upper Darby Township. Named after the Aldan family who were early landholders in Delaware County, the community developed as a residential neighborhood along the trolley line connecting it to Philadelphia and Chester.' },
      { era: 'Early Twentieth Century', title: 'Residential Growth', description: 'Throughout the early 1900s, Aldan grew as a quiet residential suburb. The borough attracted families seeking affordable homes within easy commuting distance of Philadelphia, and its compact streets filled with modest rowhouses and twins characteristic of Delaware County communities.' },
      { era: 'Modern Era', title: 'Community Character', description: 'Aldan remains a small, tight-knit residential borough. Its tree-lined streets and proximity to major transportation corridors have maintained its appeal as an affordable suburban community in the greater Philadelphia region.' },
    ],
  },
  'avondale': {
    founded: '1894',
    population: '1,272',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The Avondale area was part of the William Penn land grants in Chester County during the late 1600s. The region was predominantly agricultural, with Quaker families establishing farms throughout the rolling countryside of southern Chester County.' },
      { era: 'Industrial Age', title: 'Borough Incorporation', description: 'Avondale was incorporated as a borough in 1894. The community developed around local agriculture and the mushroom farming industry that would come to define the surrounding region, with the town serving as a small commercial center for nearby farms.' },
      { era: 'Modern Era', title: 'Agricultural Heritage', description: 'Today Avondale is part of the greater Kennett Square area, which is known as the Mushroom Capital of the World. The borough maintains its small-town character while benefiting from the agricultural economy and growing cultural diversity of southern Chester County.' },
    ],
  },
  'bear': {
    founded: '1850',
    population: '21,098',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The Bear area in New Castle County was settled during the colonial period as part of the agricultural landscape between Wilmington and the Chesapeake Bay region. The community takes its name from a tavern called the Bear that served travelers along the main road.' },
      { era: 'Post-War Growth', title: 'Suburban Development', description: 'Bear remained a small rural crossroads until the post-World War II era, when suburban development began spreading south from Wilmington along Route 40 and later Route 1. The construction of major highways transformed the area into one of Delaware fastest-growing communities.' },
      { era: 'Modern Era', title: 'Commercial Hub', description: 'Bear has become a major suburban community and commercial center in New Castle County, with extensive retail development, residential subdivisions, and proximity to major employers. Its population has grown dramatically since the 1990s.' },
    ],
  },
  'bellefonte': {
    founded: '1832',
    population: '1,246',
    history: [
      { era: 'Early Republic', title: 'Community Origins', description: 'Bellefonte is a small community in New Castle County, Delaware, located just south of Wilmington. The area developed as a residential neighborhood in the early 19th century, taking advantage of its proximity to the Brandywine Creek and the industrial mills that powered the regional economy.' },
      { era: 'Industrial Age', title: 'Suburban Growth', description: 'During the late 1800s, Bellefonte grew as workers in Wilmington industries sought nearby residential communities. The area maintained a semi-rural character while providing convenient access to the city employment centers.' },
      { era: 'Modern Era', title: 'Residential Community', description: 'Bellefonte remains a small unincorporated community within New Castle County. It retains a quiet residential character with proximity to both Wilmington and the recreational areas along the Brandywine Valley.' },
    ],
  },
  'bethesda': {
    founded: '1820',
    population: '68,056',
    history: [
      { era: 'Early Republic', title: 'Church and Crossroads', description: 'Bethesda traces its name to a Presbyterian church established in 1820 at the intersection of two major roads northwest of Washington, D.C. The area remained a rural crossroads community through much of the 19th century, with scattered farms and estates in Montgomery County, Maryland.' },
      { era: 'Early Twentieth Century', title: 'Streetcar Suburb', description: 'The arrival of streetcar lines in the early 1900s transformed Bethesda from a rural community into a commuter suburb of Washington. The National Institutes of Health established its campus in Bethesda in 1938, and the National Naval Medical Center followed in 1942, anchoring the area as a center of government and medical research.' },
      { era: 'Post-War Growth', title: 'Suburban Expansion', description: 'After World War II, Bethesda experienced rapid residential and commercial growth. The community became one of the most affluent suburbs in the Washington metropolitan area, known for its excellent schools, cultural amenities, and proximity to federal agencies.' },
      { era: 'Modern Era', title: 'Urban Village', description: 'Modern Bethesda has evolved into a walkable urban center with high-rise residential buildings, upscale retail, and a vibrant restaurant scene centered around Bethesda Row. The arrival of Metro rail service further cemented its status as a premier Washington suburb.' },
    ],
  },
  'bridgeport': {
    founded: '1851',
    population: '5,015',
    history: [
      { era: 'Early Republic', title: 'River Crossing', description: 'Bridgeport developed at a crossing point on the Schuylkill River directly across from Norristown, the county seat of Montgomery County. The location at the bridge gave the community its name and defined its identity as a gateway between Chester and Montgomery Counties.' },
      { era: 'Industrial Age', title: 'Industrial Growth', description: 'Bridgeport was incorporated as a borough in 1851 and grew alongside the industrial development of the Schuylkill Valley. Mills, factories, and the railroad brought workers and commerce to the small borough, creating a dense working-class community along the riverfront.' },
      { era: 'Modern Era', title: 'Revitalization', description: 'Like many Schuylkill Valley communities, Bridgeport has undergone revitalization in recent decades. Its proximity to Norristown, the regional rail network, and major highways has attracted new residents and investment to the compact borough.' },
    ],
  },
  'brookside': {
    founded: '1963',
    population: '14,974',
    history: [
      { era: 'Post-War Growth', title: 'Planned Community', description: 'Brookside was developed in the early 1960s as a planned residential community in New Castle County, Delaware. The development reflected the post-war suburban boom, providing affordable single-family homes for families working in the Wilmington area and at nearby industrial facilities.' },
      { era: 'Late Twentieth Century', title: 'Established Community', description: 'By the 1980s and 1990s, Brookside had matured into an established suburban community with its own schools, parks, and commercial areas. The neighborhood maintained strong community identity through civic organizations and local institutions.' },
      { era: 'Modern Era', title: 'Diverse Suburb', description: 'Today Brookside is a diverse, middle-class community in the Newark area of New Castle County. Its affordable housing stock and convenient location near major transportation corridors continue to attract families and working professionals.' },
    ],
  },
  'bryn-athyn': {
    founded: '1916',
    population: '1,375',
    history: [
      { era: 'Turn of the Century', title: 'New Church Community', description: 'Bryn Athyn was founded as a community centered around the General Church of the New Jerusalem, a Swedenborgian denomination. The Pitcairn family, whose fortune came from Pittsburgh Plate Glass, were instrumental in establishing the community and its distinctive religious and educational institutions in Montgomery County.' },
      { era: 'Early Twentieth Century', title: 'Cathedral and Architecture', description: 'The construction of Bryn Athyn Cathedral, begun in 1914 and completed over several decades, established the community as an architectural landmark. Built using medieval craft techniques under the direction of Raymond Pitcairn, the cathedral and surrounding Glencairn Museum showcase Romanesque and Gothic Revival architecture.' },
      { era: 'Modern Era', title: 'Academic Community', description: 'Bryn Athyn is home to Bryn Athyn College and the Academy of the New Church. The borough was incorporated in 1929 and maintains its unique character as a religious and educational community, with the cathedral and Glencairn Museum drawing visitors from across the region.' },
    ],
  },
  'center-city': {
    founded: '1682',
    population: '68,000',
    history: [
      { era: 'Colonial Origins', title: 'Penn\'s Green Country Town', description: 'Center City encompasses the historic core of Philadelphia, laid out by William Penn in 1682 as a "greene country towne." Penn\'s original grid plan, stretching between the Delaware and Schuylkill Rivers, established the framework for what would become the commercial and governmental heart of the city.' },
      { era: 'Revolutionary Period', title: 'Birthplace of the Nation', description: 'Center City was the epicenter of American independence. Independence Hall, where the Declaration of Independence was signed and the Constitution debated, stands at the heart of the neighborhood. Philadelphia served as the nation\'s capital from 1790 to 1800, with the seat of government located in Center City.' },
      { era: 'Industrial Age', title: 'Commercial Capital', description: 'By the 19th century, Center City had evolved into a major commercial district. The construction of City Hall, completed in 1901 atop the intersection of Broad and Market Streets, cemented the area as Philadelphia\'s business center. Department stores like Wanamaker\'s and Lit Brothers drew shoppers from across the region.' },
      { era: 'Modern Era', title: 'Urban Renaissance', description: 'Center City has experienced a dramatic urban renaissance since the 1990s, with residential conversions of historic buildings, new construction, and a thriving restaurant and arts scene. The neighborhood is now one of the most densely populated and walkable urban cores in the United States.' },
    ],
  },
  'charlestown': {
    founded: '1742',
    population: '1,496',
    history: [
      { era: 'Colonial Era', title: 'Colonial Port Town', description: 'Charlestown was established in 1742 as a port town at the head of the Chesapeake Bay in Cecil County, Maryland. The town was an important colonial-era shipping point, competing with nearby Head of Elk (now Elkton) for trade along the upper bay.' },
      { era: 'Revolutionary Period', title: 'Revolutionary War Activity', description: 'During the American Revolution, Charlestown saw military activity as British and American forces moved through the upper Chesapeake region. The town\'s strategic location at the head of the bay made it a point of interest during the conflict.' },
      { era: 'Modern Era', title: 'Quiet Heritage Community', description: 'Charlestown has evolved into a quiet residential community that preserves much of its colonial-era character. The town\'s waterfront location and historic architecture attract visitors interested in Cecil County\'s maritime heritage.' },
    ],
  },
  'chesapeake-city': {
    founded: '1849',
    population: '736',
    history: [
      { era: 'Early Republic', title: 'Canal Town Origins', description: 'Chesapeake City owes its existence to the Chesapeake and Delaware Canal, which was completed in 1829. The town developed as a vital stop along the canal, serving as a lock station and commercial center for vessels transiting between the Chesapeake and Delaware Bays.' },
      { era: 'Industrial Age', title: 'Prosperous Canal Port', description: 'During the 19th century, Chesapeake City thrived as a canal port with hotels, shops, and services catering to canal traffic. The town was incorporated in 1849 and enjoyed prosperity until the canal was widened and deepened in the 1920s, eliminating the need for lock operations in the town.' },
      { era: 'Modern Era', title: 'Tourism Destination', description: 'After decades of decline following the canal modernization, Chesapeake City reinvented itself as a charming tourism destination. Its historic waterfront district, with restored 19th-century buildings housing restaurants and shops, draws visitors to this small Cecil County gem.' },
    ],
  },
  'chevy-chase': {
    founded: '1890',
    population: '10,540',
    history: [
      { era: 'Colonial Era', title: 'Land Patent Origins', description: 'The name Chevy Chase derives from a colonial land patent granted in the 1700s, referencing the English-Scottish border ballad "The Ballad of Chevy Chase." The area in Montgomery County, Maryland remained rural farmland for most of its early history.' },
      { era: 'Turn of the Century', title: 'Planned Streetcar Suburb', description: 'Senator Francis Newlands developed Chevy Chase in the 1890s as one of America\'s first planned streetcar suburbs. He built the Rock Creek Railway to connect the community to downtown Washington, D.C., and established strict architectural standards that gave the area its distinctive character of large homes on tree-lined streets.' },
      { era: 'Modern Era', title: 'Affluent Community', description: 'Chevy Chase has maintained its reputation as one of the most affluent communities in the Washington metropolitan area. The area includes several distinct villages and sections, each with its own local governance, united by excellent schools, cultural institutions, and proximity to the nation\'s capital.' },
    ],
  },
  'claymont': {
    founded: '1820',
    population: '9,895',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The Claymont area in northern New Castle County was settled during the colonial period as part of the agricultural landscape along the Delaware River. The Robinson House, built circa 1723, is one of the oldest surviving structures in the area and reflects the region\'s colonial heritage.' },
      { era: 'Industrial Age', title: 'Industrial Development', description: 'Claymont developed in the 19th century as industries located along the Delaware River and the railroad corridor. The community grew as workers settled near the Worth Steel Company and other manufacturing operations that took advantage of river and rail access.' },
      { era: 'Modern Era', title: 'Suburban Redevelopment', description: 'Claymont has undergone significant redevelopment in recent years, with plans to transform its aging commercial corridor into a more walkable, mixed-use community. Its location at the Delaware-Pennsylvania border and proximity to I-95 keep it connected to the larger Philadelphia-Wilmington metropolitan area.' },
    ],
  },
  'collingdale': {
    founded: '1891',
    population: '8,908',
    history: [
      { era: 'Victorian Origins', title: 'Borough Founding', description: 'Collingdale was incorporated as a borough in 1891 from portions of Darby Township in Delaware County. The community developed as a residential suburb along the trolley lines connecting it to Philadelphia, attracting working-class families seeking affordable homes outside the city.' },
      { era: 'Early Twentieth Century', title: 'Streetcar Suburb Growth', description: 'During the early 1900s, Collingdale grew rapidly as trolley service made commuting to Philadelphia practical. The borough filled with rowhouses and twin homes, creating the dense residential character that defines the community today.' },
      { era: 'Modern Era', title: 'Diverse Community', description: 'Collingdale has become one of the most ethnically diverse communities in Delaware County. Its affordable housing stock and transit access continue to attract new residents, while community organizations work to maintain the borough\'s neighborhoods and public spaces.' },
    ],
  },
  'columbia-pa': {
    founded: '1814',
    population: '10,396',
    history: [
      { era: 'Colonial Era', title: 'Wright\'s Ferry Settlement', description: 'The area now known as Columbia was first settled in the early 1700s at a strategic Susquehanna River crossing. John Wright established a ferry service in 1730, and the settlement that grew around it was seriously considered as a potential site for the new nation\'s capital, losing the vote by only a narrow margin.' },
      { era: 'Antebellum Era', title: 'Underground Railroad Hub', description: 'Columbia played a significant role in the Underground Railroad during the antebellum period. Its location on the Susquehanna River, near the Mason-Dixon Line, made it a crucial crossing point for freedom seekers. The town\'s African American community, centered in the neighborhood known as Tow Hill, actively aided those escaping slavery.' },
      { era: 'Industrial Age', title: 'Industrial Prosperity', description: 'The arrival of the Pennsylvania Railroad and the lumber industry brought prosperity to Columbia in the mid-to-late 1800s. The town became a center for lumber processing, with logs floated down the Susquehanna, and iron manufacturing also contributed to its industrial growth.' },
      { era: 'Modern Era', title: 'Heritage Tourism', description: 'Columbia has reinvented itself through heritage tourism and arts. The town\'s well-preserved 19th-century architecture, museums including the National Watch and Clock Museum, and riverside location attract visitors while the community works to revitalize its historic downtown.' },
    ],
  },
  'conway': {
    founded: '1732',
    population: '24,849',
    history: [
      { era: 'Colonial Era', title: 'Kingston Township', description: 'Conway, the county seat of Horry County, South Carolina, was originally known as Kingston and later Conwayborough. The settlement was established in the colonial era along the Waccamaw River, serving as the governmental and commercial center for the surrounding agricultural region.' },
      { era: 'Antebellum Era', title: 'River Commerce', description: 'During the antebellum period, Conway\'s economy centered on river commerce and the naval stores industry, with turpentine and timber shipped down the Waccamaw River. The town served as the seat of Horry County government, a role it maintains to this day.' },
      { era: 'Early Twentieth Century', title: 'Tobacco Economy', description: 'In the early 20th century, tobacco farming transformed the local economy. Conway became a tobacco market town with warehouses and auction houses. Coastal Carolina University, originally a branch of the College of Charleston, was founded here in 1954.' },
      { era: 'Modern Era', title: 'Growing University Town', description: 'Conway has grown significantly as Coastal Carolina University expanded into a major institution. The city\'s historic Riverwalk along the Waccamaw River and its well-preserved downtown district have become attractions, complementing the nearby Grand Strand beach tourism economy.' },
    ],
  },
  'derwood': {
    founded: '1873',
    population: '4,500',
    history: [
      { era: 'Industrial Age', title: 'Railroad Community', description: 'Derwood developed as a small community along the Baltimore and Ohio Railroad in Montgomery County, Maryland. The railroad stop, established in the 1870s, gave the settlement its identity as a quiet residential area between Rockville and Gaithersburg.' },
      { era: 'Post-War Growth', title: 'Suburban Development', description: 'After World War II, Derwood grew along with the rest of Montgomery County as the Washington, D.C. suburbs expanded. The construction of I-270 nearby further connected the community to the regional employment centers and accelerated residential development.' },
      { era: 'Modern Era', title: 'Residential Community', description: 'Derwood is now a census-designated place within Montgomery County, characterized by single-family residential neighborhoods. Its proximity to the Shady Grove Metro station and the I-270 technology corridor provides convenient access to regional employment.' },
    ],
  },
  'drexel-hill': {
    founded: '1890',
    population: '29,181',
    history: [
      { era: 'Victorian Origins', title: 'Suburban Development', description: 'Drexel Hill began developing in the 1890s as a residential community in Upper Darby Township, Delaware County. Named in connection with the prominent Drexel family of Philadelphia, the area attracted middle-class families seeking suburban living with convenient access to the city via trolley lines.' },
      { era: 'Post-War Growth', title: 'Suburban Boom', description: 'After World War II, Drexel Hill experienced rapid growth as returning veterans and their families filled new housing developments. The community became one of the largest unincorporated suburbs in Delaware County, known for its tree-lined streets, good schools, and strong community identity.' },
      { era: 'Modern Era', title: 'Established Community', description: 'Drexel Hill remains a large, established residential community within Upper Darby Township. Its diverse housing stock, from pre-war twins to mid-century single-family homes, provides options across price ranges, and its central location in Delaware County ensures easy access to Philadelphia and regional highways.' },
    ],
  },
  'eagleview': {
    founded: '1998',
    population: '1,644',
    history: [
      { era: 'Late Twentieth Century', title: 'New Urbanism Development', description: 'Eagleview is a master-planned community in Uwchlan Township, Chester County, that began development in the late 1990s. Designed according to new urbanist principles, the community features walkable neighborhoods with a mix of housing types, retail, and office space centered around a town center.' },
      { era: 'Modern Era', title: 'Growing Community', description: 'Eagleview has grown into a prominent planned community in the rapidly developing Exton-Downingtown corridor. Its town center, anchored by retail and dining establishments, serves as a gathering place for residents of the surrounding neighborhoods. The community reflects the shift toward mixed-use, walkable suburban development in Chester County.' },
    ],
  },
  'elizabethtown': {
    founded: '1827',
    population: '11,893',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The area that would become Elizabethtown was settled in the early 1700s by Scots-Irish and German immigrants in Lancaster County. The town was named for the wife of Captain Barnabas Hughes, who laid out the original town lots along the main road between Lancaster and Harrisburg.' },
      { era: 'Industrial Age', title: 'Railroad Town', description: 'Elizabethtown was incorporated as a borough in 1827 and grew with the arrival of the railroad. Elizabethtown College was founded in 1899 by the Church of the Brethren, establishing the community as both an industrial and educational center in northwestern Lancaster County.' },
      { era: 'Modern Era', title: 'College Town', description: 'Today Elizabethtown is defined by its college campus and its position along the Amtrak Keystone Corridor. The borough blends small-town charm with academic vitality, and the Masonic Village retirement community is one of the largest continuing care facilities in the region.' },
    ],
  },
  'elsmere': {
    founded: '1909',
    population: '5,814',
    history: [
      { era: 'Turn of the Century', title: 'Borough Founding', description: 'Elsmere was incorporated as a town in 1909 from portions of the Brandywine Hundred area of New Castle County, Delaware. Located just west of Wilmington, the community developed as a streetcar suburb providing affordable housing for workers employed in Wilmington\'s industries.' },
      { era: 'Post-War Growth', title: 'Suburban Community', description: 'Elsmere grew steadily through the mid-20th century as Wilmington\'s suburbs expanded. The town maintained a working-class character with modest homes along tree-lined streets and a small commercial district along Kirkwood Highway.' },
      { era: 'Modern Era', title: 'Gateway Community', description: 'Elsmere serves as a gateway between Wilmington and the western suburbs of New Castle County. Recent revitalization efforts have focused on its commercial corridors and public spaces, while the town maintains its identity as an affordable residential community close to urban amenities.' },
    ],
  },
  'enterprise': {
    founded: '1996',
    population: '171,017',
    history: [
      { era: 'Late Twentieth Century', title: 'Suburban Development', description: 'Enterprise is an unincorporated community and census-designated place in Clark County, Nevada, located in the southern Las Vegas Valley. The area began developing rapidly in the 1990s as Las Vegas expanded southward, with master-planned residential communities, shopping centers, and commercial developments.' },
      { era: 'Modern Era', title: 'Growing Community', description: 'Enterprise has become one of the most populous CDPs in Nevada, driven by continued residential construction and proximity to the Las Vegas Strip and McCarran International Airport. The community includes Mountain\'s Edge, a major master-planned development, and continues to grow as southern Las Vegas Valley development extends toward the Spring Mountains.' },
    ],
  },
  'ephrata': {
    founded: '1891',
    population: '14,008',
    history: [
      { era: 'Colonial Era', title: 'Cloister Community', description: 'Ephrata\'s most distinctive historical legacy is the Ephrata Cloister, a religious community founded in 1732 by Conrad Beissel and a group of German Pietist settlers. The Cloister was known for its distinctive medieval-style architecture, original hymns, and communal lifestyle, and served as a hospital after the Battle of Brandywine in 1777.' },
      { era: 'Industrial Age', title: 'Borough Growth', description: 'Ephrata was incorporated as a borough in 1891 and developed as a commercial center in northeastern Lancaster County. The railroad connected the town to regional markets, and local industries including textiles and food processing contributed to steady growth throughout the late 19th and early 20th centuries.' },
      { era: 'Modern Era', title: 'Heritage and Commerce', description: 'Today Ephrata is a thriving small city that balances historic preservation with modern commercial development. The Ephrata Cloister is a National Historic Landmark and museum, while the borough\'s downtown and surrounding commercial areas serve as a retail hub for the surrounding agricultural region.' },
    ],
  },
  'folsom': {
    founded: '1890',
    population: '8,323',
    history: [
      { era: 'Industrial Age', title: 'Community Origins', description: 'Folsom is an unincorporated community in Ridley Township, Delaware County, that developed in the late 19th century as a residential area near the industrial centers of Chester and Philadelphia. The community grew along the railroad and trolley corridors that connected Delaware County suburbs to the city.' },
      { era: 'Post-War Growth', title: 'Suburban Development', description: 'After World War II, Folsom expanded with new housing developments that attracted families seeking suburban living in Delaware County. The community developed its own identity with local businesses, schools, and community organizations.' },
      { era: 'Modern Era', title: 'Residential Community', description: 'Folsom remains a predominantly residential community within Ridley Township. Its location along MacDade Boulevard provides commercial amenities, while its proximity to I-95 and regional rail connects residents to Philadelphia and the broader Delaware Valley.' },
    ],
  },
  'garden-city': {
    founded: '1960',
    population: '10,000',
    history: [
      { era: 'Post-War Growth', title: 'Beach Community Development', description: 'Garden City is an unincorporated community along the South Carolina coast in Horry County, situated between Murrells Inlet and Surfside Beach. The area developed primarily in the mid-20th century as beach tourism expanded along the Grand Strand, with vacation homes and rental properties lining the oceanfront.' },
      { era: 'Modern Era', title: 'Resort Community', description: 'Garden City Beach has become a popular family-friendly beach destination known for its fishing pier and relaxed atmosphere. The community offers a quieter alternative to nearby Myrtle Beach while remaining connected to the Grand Strand\'s tourism infrastructure and attractions.' },
    ],
  },
  'glasgow': {
    founded: '1750',
    population: '15,288',
    history: [
      { era: 'Colonial Era', title: 'Crossroads Community', description: 'Glasgow is an unincorporated community in New Castle County, Delaware, located at a historic crossroads between Newark and the Chesapeake and Delaware Canal. The area was settled in the colonial period as part of the agricultural landscape of southern New Castle County.' },
      { era: 'Post-War Growth', title: 'Suburban Expansion', description: 'Glasgow experienced significant growth in the second half of the 20th century as suburban development spread south from Newark and Wilmington. New housing developments, commercial centers, and the Peoples Plaza shopping area transformed the former rural crossroads into a suburban community.' },
      { era: 'Modern Era', title: 'Growing Community', description: 'Glasgow continues to grow as one of the more affordable communities in the Newark area of New Castle County. Its location near the University of Delaware, major highways, and the Delaware-Maryland border makes it a convenient residential choice for commuters throughout the region.' },
    ],
  },
  'glenolden': {
    founded: '1894',
    population: '7,223',
    history: [
      { era: 'Victorian Origins', title: 'Borough Founding', description: 'Glenolden was incorporated as a borough in 1894 from portions of Darby Township in Delaware County. The community developed along the railroad corridor south of Philadelphia, attracting residents who worked in nearby industrial centers and commuted via the rail line.' },
      { era: 'Early Twentieth Century', title: 'Residential Growth', description: 'Through the early 1900s, Glenolden grew as a working-class residential community. Its proximity to the Chester Pike commercial corridor and Philadelphia-area employers made it an accessible and affordable suburb for families throughout Delaware County.' },
      { era: 'Modern Era', title: 'Community Character', description: 'Glenolden maintains its character as a compact residential borough in Delaware County. The community benefits from regional rail service and highway access while preserving its small-town identity through local institutions and community events.' },
    ],
  },
  'greenville': {
    founded: '1800',
    population: '3,104',
    history: [
      { era: 'Early Republic', title: 'Du Pont Country', description: 'Greenville is an unincorporated community in New Castle County, Delaware, situated in the Brandywine Valley northwest of Wilmington. The area has been associated with the du Pont family since the early 1800s, when Eleuthère Irénée du Pont established his gunpowder mills along the Brandywine Creek.' },
      { era: 'Industrial Age', title: 'Estate Development', description: 'Throughout the 19th and early 20th centuries, members of the du Pont family built grand estates throughout the Greenville area. Properties like Winterthur, Nemours, and Hagley helped establish the Brandywine Valley as one of America\'s wealthiest enclaves.' },
      { era: 'Modern Era', title: 'Affluent Community', description: 'Greenville remains one of the most affluent communities in Delaware, known for its large estates, equestrian properties, and proximity to world-class museums and gardens. The Winterthur Museum, Hagley Museum, and nearby Longwood Gardens draw visitors from around the world.' },
    ],
  },
  'hatfield': {
    founded: '1873',
    population: '3,496',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The Hatfield area of Montgomery County was settled by Welsh and English colonists in the early 1700s as part of William Penn\'s land grants. The community remained agricultural through the colonial period, with scattered farms and the influence of local Mennonite communities.' },
      { era: 'Industrial Age', title: 'Railroad Development', description: 'Hatfield Borough was incorporated in 1873 following the arrival of the North Penn Railroad, which connected the community to Philadelphia. The railroad stimulated growth, with small industries and commercial establishments developing around the station area.' },
      { era: 'Modern Era', title: 'Suburban Community', description: 'Hatfield has grown into a suburban community in the Indian Valley region of Montgomery County. The borough and surrounding Hatfield Township together form a significant residential and commercial area, benefiting from proximity to the Route 309 corridor and regional transportation networks.' },
    ],
  },
  'hockessin': {
    founded: '1688',
    population: '13,478',
    history: [
      { era: 'Colonial Era', title: 'Quaker Settlement', description: 'Hockessin was settled in the late 1600s by Quaker families who established farms in the rolling hills of northern New Castle County, Delaware. The Hockessin Friends Meeting House, founded in 1738, anchored the community and reflected the Quaker values that shaped its early development.' },
      { era: 'Antebellum Era', title: 'Underground Railroad', description: 'Hockessin played a role in the Underground Railroad during the antebellum period. The community\'s Quaker residents, committed to abolitionism, provided safe passage for freedom seekers traveling north through Delaware. The area is home to several documented Underground Railroad sites.' },
      { era: 'Modern Era', title: 'Affluent Suburb', description: 'Hockessin has developed into one of Delaware\'s most affluent communities, known for excellent schools, equestrian properties, and a village center with local shops and restaurants. The community\'s rural character has been preserved even as surrounding areas have experienced suburban development.' },
    ],
  },
  'horsham': {
    founded: '1717',
    population: '26,147',
    history: [
      { era: 'Colonial Era', title: 'Welsh Settlement', description: 'Horsham Township was established in 1717 in Montgomery County, named after Horsham in Sussex, England. Welsh Quaker families were among the earliest settlers, establishing farms on the gently rolling landscape north of Philadelphia.' },
      { era: 'Early Twentieth Century', title: 'Military Installation', description: 'Horsham became home to a naval air station in 1942, which operated as Naval Air Station Joint Reserve Base Willow Grove until its closure in 2011. The military installation was a major employer and defining feature of the township for nearly 70 years.' },
      { era: 'Modern Era', title: 'Suburban Hub', description: 'Horsham has evolved into a major suburban township with significant corporate presence, including Toll Brothers headquarters. The former naval air station site is being redeveloped as a mixed-use community, and the township\'s location along the Route 611 and Turnpike corridors makes it a well-connected residential and commercial center.' },
    ],
  },
  'lansdowne': {
    founded: '1893',
    population: '11,107',
    history: [
      { era: 'Victorian Origins', title: 'Planned Suburb', description: 'Lansdowne was incorporated as a borough in 1893 and developed as a planned residential suburb in Delaware County. The community was laid out with wide, tree-lined streets and attractive Victorian homes, designed to appeal to middle-class families commuting to Philadelphia via the trolley and railroad.' },
      { era: 'Early Twentieth Century', title: 'Cultural Growth', description: 'Lansdowne became known as a culturally vibrant community in the early 20th century. The 20th Century Club, a women\'s cultural organization, and the Lansdowne Theater (opened 1927) reflected the community\'s commitment to arts and civic life.' },
      { era: 'Modern Era', title: 'Diverse Community', description: 'Lansdowne has evolved into one of the most diverse communities in Delaware County, celebrated for its multiculturalism and inclusive character. The borough has focused on downtown revitalization, with its farmers market and community events strengthening neighborhood connections.' },
    ],
  },
  'las-vegas': {
    founded: '1905',
    population: '641,903',
    history: [
      { era: 'Frontier Era', title: 'Desert Oasis', description: 'The Las Vegas Valley was home to Paiute people for thousands of years before Spanish explorers encountered the area\'s artesian wells in the early 19th century. The name "Las Vegas," meaning "the meadows" in Spanish, referred to the natural springs that made the desert valley habitable.' },
      { era: 'Turn of the Century', title: 'Railroad Town', description: 'Las Vegas was founded as a city in 1905 when the San Pedro, Los Angeles and Salt Lake Railroad auctioned 110 acres of land alongside its tracks. The railroad brought workers and travelers through the desert, establishing Las Vegas as a water stop and service point between Los Angeles and Salt Lake City.' },
      { era: 'Early Twentieth Century', title: 'Dam and Gambling', description: 'The construction of Hoover Dam in the 1930s brought thousands of workers to the region and transformed Las Vegas into a boomtown. Nevada legalized gambling in 1931, and the first casinos and hotels began appearing on what would become the famous Las Vegas Strip, drawing visitors seeking entertainment in the desert.' },
      { era: 'Post-War Growth', title: 'Entertainment Capital', description: 'After World War II, Las Vegas evolved into an internationally renowned entertainment destination. The rise of mega-resorts, world-class shows, and the iconic Strip transformed the city from a small desert town into the "Entertainment Capital of the World," attracting millions of visitors annually.' },
      { era: 'Modern Era', title: 'Metropolitan Expansion', description: 'Modern Las Vegas has diversified beyond gambling to become a major metropolitan area with professional sports teams, technology companies, and a growing residential population. The city continues to reinvent itself, balancing its entertainment legacy with the needs of a rapidly growing Sun Belt community.' },
    ],
  },
  'little-river': {
    founded: '1880',
    population: '11,711',
    history: [
      { era: 'Industrial Age', title: 'Fishing Village', description: 'Little River developed in the late 19th century as a small fishing and farming community at the northern end of what is now the Grand Strand in Horry County, South Carolina. Located near the North Carolina border along the Intracoastal Waterway, the settlement served as a quiet waterfront village.' },
      { era: 'Modern Era', title: 'Tourism Growth', description: 'Little River has grown into a popular destination known for its fishing charters, waterfront restaurants, and casino boat operations. The community has experienced significant residential growth as the Myrtle Beach metropolitan area has expanded northward, while maintaining its identity as a waterfront community distinct from the larger resort areas to the south.' },
    ],
  },
  'manayunk': {
    founded: '1824',
    population: '10,000',
    history: [
      { era: 'Industrial Age', title: 'Canal and Mill Town', description: 'Manayunk developed along the Schuylkill Canal in the 1820s as a textile manufacturing center in northwestern Philadelphia. The name comes from the Lenape word meaning "where we go to drink," referencing the Schuylkill River. The steep hillsides above the canal filled with row homes for mill workers, creating a distinctive working-class neighborhood.' },
      { era: 'Turn of the Century', title: 'Industrial Peak', description: 'By the late 19th century, Manayunk was a bustling mill town with dozens of textile factories along the canal and river. The neighborhood\'s Main Street served as its commercial center, with shops, taverns, and services catering to the large working-class population drawn from Irish, Italian, and Polish immigrant communities.' },
      { era: 'Late Twentieth Century', title: 'Decline and Revival', description: 'As the textile industry declined in the mid-20th century, Manayunk experienced economic hardship. However, beginning in the 1980s, the neighborhood underwent a dramatic revival, with Main Street transforming into a popular destination for dining, shopping, and nightlife.' },
      { era: 'Modern Era', title: 'Urban Destination', description: 'Modern Manayunk is one of Philadelphia\'s most popular neighborhoods for young professionals, known for its vibrant Main Street, the annual Manayunk Bike Race, and the Manayunk Towpath trail along the Schuylkill River. The neighborhood blends its industrial heritage with contemporary urban living.' },
    ],
  },
  'middletown': {
    founded: '1861',
    population: '24,164',
    history: [
      { era: 'Colonial Era', title: 'Agricultural Origins', description: 'Middletown was settled in the early 1700s as an agricultural community in southern New Castle County, Delaware, situated roughly midway between the Appoquinimink Creek and the Bohemia River. Its central location between Philadelphia and Baltimore gave the town its name.' },
      { era: 'Industrial Age', title: 'Town Incorporation', description: 'Middletown was incorporated in 1861 and served as a market town for the surrounding farming region. The railroad connected the community to larger cities, and the town developed a compact downtown with shops, banks, and civic buildings typical of 19th-century small towns.' },
      { era: 'Modern Era', title: 'Explosive Growth', description: 'Middletown has experienced extraordinary population growth since the 1990s, transforming from a quiet agricultural town into one of Delaware\'s fastest-growing communities. Major residential developments have attracted families from the Wilmington and Philadelphia regions, drawn by newer housing stock, lower costs, and good schools.' },
    ],
  },
  'millersville': {
    founded: '1855',
    population: '8,473',
    history: [
      { era: 'Antebellum Era', title: 'University Origins', description: 'Millersville\'s identity has been shaped by its university since 1855, when the Lancaster County Normal School was established to train teachers. The institution, which would eventually become Millersville University of Pennsylvania, anchored the community\'s growth in Lancaster County.' },
      { era: 'Industrial Age', title: 'College Town Growth', description: 'As the Normal School expanded through the late 19th and early 20th centuries, Millersville developed as a residential community serving the institution. The borough was incorporated in 1930, formalizing the governance of a community that had grown around the campus.' },
      { era: 'Modern Era', title: 'University Community', description: 'Millersville is defined by its relationship with Millersville University, a public institution with approximately 8,000 students. The borough blends a small-town atmosphere with the cultural and educational resources of a university community in southeastern Lancaster County.' },
    ],
  },
  'modena': {
    founded: '1894',
    population: '1,847',
    history: [
      { era: 'Industrial Age', title: 'Industrial Borough', description: 'Modena was incorporated as a borough in 1894 in Chester County, adjacent to the larger city of Coatesville. The community developed as a working-class neighborhood closely tied to the Lukens Steel Company and other industries in the Brandywine Creek valley.' },
      { era: 'Early Twentieth Century', title: 'Steel Town Identity', description: 'Throughout the early 20th century, Modena\'s residents were primarily steelworkers and their families employed at the nearby Lukens Steel plant. The small borough shared the economic fortunes of the steel industry, experiencing prosperity during wartime production and hardship during downturns.' },
      { era: 'Modern Era', title: 'Small Borough', description: 'Modena remains one of Chester County\'s smallest boroughs, maintaining a close-knit community character. The decline of the steel industry has shifted the local economy, but the borough\'s affordable housing and proximity to Coatesville continue to sustain its residential community.' },
    ],
  },
  'mount-joy': {
    founded: '1851',
    population: '8,468',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'Mount Joy was settled in the mid-1700s by Scots-Irish and German immigrants in Lancaster County. The town was named, according to local tradition, to contrast with nearby Mount Misery, reflecting the settlers\' more favorable impression of the area\'s landscape.' },
      { era: 'Industrial Age', title: 'Railroad and Brewing', description: 'Mount Joy was incorporated as a borough in 1851 and grew with the Pennsylvania Railroad. Bube\'s Brewery, established in 1876, became a local landmark and is one of the few pre-Prohibition breweries in the country still operating in its original building.' },
      { era: 'Modern Era', title: 'Growing Borough', description: 'Mount Joy has experienced significant residential growth as Lancaster County\'s population has expanded. The borough\'s location along the Amtrak Keystone Corridor provides direct rail access to Philadelphia and Harrisburg, while its small-town downtown has attracted new restaurants and shops.' },
    ],
  },
  'murrells-inlet': {
    founded: '1880',
    population: '9,292',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'Murrells Inlet is one of the oldest fishing villages on the South Carolina coast, with roots dating to colonial times. Named after Captain John Murrell, a colonial-era landowner, the inlet area along the saltwater marshes of Horry County served as a base for fishing, oystering, and rice cultivation.' },
      { era: 'Early Twentieth Century', title: 'Seafood Destination', description: 'By the early 20th century, Murrells Inlet had become known as the "Seafood Capital of South Carolina." Its waterfront restaurants, fed by local fishing boats, drew visitors from across the region seeking fresh seafood in a rustic coastal setting.' },
      { era: 'Modern Era', title: 'Coastal Community', description: 'Murrells Inlet has grown as a residential and tourism community along the southern Grand Strand. The MarshWalk, a waterfront boardwalk with restaurants and entertainment venues, has become a signature attraction, while the area also serves as a gateway to Huntington Beach State Park and Brookgreen Gardens.' },
    ],
  },
  'newport': {
    founded: '1735',
    population: '910',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'Newport is a small town in New Castle County, Delaware, situated along the Christina River. The community was established in the colonial period and developed as a crossroads settlement near the intersection of roads connecting Wilmington to points south and west.' },
      { era: 'Industrial Age', title: 'Industrial Community', description: 'Newport grew in the 19th century as industries located along the Christina River corridor. The town served as a small commercial center for the surrounding agricultural area while benefiting from proximity to Wilmington\'s industrial economy.' },
      { era: 'Modern Era', title: 'Small Town Character', description: 'Newport maintains its character as one of Delaware\'s smallest incorporated towns. Despite being surrounded by suburban development in New Castle County, the town preserves a distinct identity with its compact historic center and residential neighborhoods.' },
    ],
  },
  'north-east': {
    founded: '1849',
    population: '4,085',
    history: [
      { era: 'Colonial Era', title: 'Waterfront Settlement', description: 'North East is a town in Cecil County, Maryland, situated at the mouth of the North East River where it meets the Chesapeake Bay. The area was settled in the colonial period and served as a small port for commerce along the upper bay.' },
      { era: 'Industrial Age', title: 'Town Growth', description: 'North East was incorporated in 1849 and developed as a fishing, canning, and agricultural community. The town\'s waterfront location made it a center for the Chesapeake Bay\'s commercial fishing industry, and the railroad further connected it to regional markets.' },
      { era: 'Modern Era', title: 'Waterfront Tourism', description: 'North East has reinvented itself as a destination for waterfront tourism and recreation. The town\'s Main Street has been revitalized with shops, restaurants, and galleries, while its marinas and access to the Chesapeake Bay attract boaters and anglers.' },
    ],
  },
  'north-las-vegas': {
    founded: '1946',
    population: '262,527',
    history: [
      { era: 'Post-War Growth', title: 'City Founding', description: 'North Las Vegas was incorporated in 1946, originally developing as a residential community north of the Las Vegas Strip. The city grew in connection with Nellis Air Force Base, which has been a major presence and employer in the area since World War II.' },
      { era: 'Late Twentieth Century', title: 'Suburban Expansion', description: 'North Las Vegas experienced explosive growth in the 1990s and 2000s as the Las Vegas metropolitan area expanded. New master-planned communities, shopping centers, and infrastructure transformed vast stretches of desert into suburban neighborhoods, making it one of the fastest-growing cities in the nation.' },
      { era: 'Modern Era', title: 'Diverse City', description: 'North Las Vegas has become a diverse, family-oriented city that is the fourth-largest in Nevada. The city has attracted distribution centers, manufacturing, and technology companies, diversifying its economy beyond its military and residential roots.' },
    ],
  },
  'north-myrtle-beach': {
    founded: '1968',
    population: '16,079',
    history: [
      { era: 'Early Twentieth Century', title: 'Beach Communities', description: 'The area that is now North Myrtle Beach originally consisted of four separate beach communities: Cherry Grove, Ocean Drive, Crescent Beach, and Windy Hill. These communities developed in the early-to-mid 20th century as beach resorts along the northern Grand Strand in Horry County, South Carolina.' },
      { era: 'Post-War Growth', title: 'City Consolidation', description: 'North Myrtle Beach was formed in 1968 through the consolidation of the four beach communities. The merger created a unified city that could better coordinate development, infrastructure, and tourism promotion along the northern end of the Grand Strand.' },
      { era: 'Modern Era', title: 'Resort City', description: 'North Myrtle Beach is known as the birthplace of the shag dance and hosts the annual SOS (Society of Stranders) festival celebrating beach music culture. The city has grown significantly as a family-oriented resort destination, offering a somewhat quieter alternative to Myrtle Beach while maintaining a vibrant tourism economy.' },
    ],
  },
  'odessa': {
    founded: '1721',
    population: '366',
    history: [
      { era: 'Colonial Era', title: 'Cantwell\'s Bridge', description: 'Odessa was originally known as Cantwell\'s Bridge, established as a colonial trading post on the Appoquinimink Creek in New Castle County, Delaware. The settlement served as a grain shipping port, sending wheat and flour to Philadelphia and other markets via the creek and Delaware Bay.' },
      { era: 'Early Republic', title: 'Prosperous Port', description: 'In the late 18th and early 19th centuries, Cantwell\'s Bridge was one of the most prosperous grain ports on the Delmarva Peninsula. The town was renamed Odessa in 1855 after the Ukrainian port city, reflecting its identity as a grain-shipping center. Many of the fine Federal and Victorian-era buildings from this prosperous period survive today.' },
      { era: 'Modern Era', title: 'Historic Village', description: 'Odessa is now a tiny, well-preserved historic village maintained largely by the Historic Odessa Foundation. The Corbit-Sharp House and other restored buildings offer a window into the town\'s prosperous mercantile past, making it a destination for history enthusiasts visiting the Delaware countryside.' },
    ],
  },
  'pennsburg': {
    founded: '1887',
    population: '3,889',
    history: [
      { era: 'Colonial Era', title: 'German Settlement', description: 'The Pennsburg area in the upper Perkiomen Valley of Montgomery County was settled by German immigrants in the early 1700s. The community\'s Germanic heritage is reflected in its name, combining "Penn" (for William Penn) with the German suffix "-burg" meaning town or fortress.' },
      { era: 'Industrial Age', title: 'Borough Incorporation', description: 'Pennsburg was incorporated as a borough in 1887, developing as a small commercial center for the surrounding agricultural communities of the upper Perkiomen Valley. The railroad connected the town to Philadelphia and regional markets, supporting local mills, shops, and tradespeople.' },
      { era: 'Modern Era', title: 'Small Town Character', description: 'Pennsburg maintains its small-town character in the upper Perkiomen Valley, serving as a commercial center alongside neighboring East Greenville and Red Hill. The borough\'s downtown retains historic buildings while adapting to serve modern residents of the growing Indian Valley region of Montgomery County.' },
    ],
  },
  'perryville': {
    founded: '1882',
    population: '4,391',
    history: [
      { era: 'Colonial Era', title: 'River Crossing', description: 'Perryville developed at a strategic crossing point on the Susquehanna River in Cecil County, Maryland. Named after Commodore Oliver Hazard Perry, the community served as an important transportation link where travelers and goods crossed the river between the eastern and western shores of Maryland.' },
      { era: 'Turn of the Century', title: 'Veterans Center', description: 'The Perry Point Veterans Affairs Medical Center, established in the early 20th century on a former estate along the Susquehanna, became the community\'s largest employer and most prominent institution. The VA center has served veterans for over a century and continues to anchor the local economy.' },
      { era: 'Modern Era', title: 'Waterfront Community', description: 'Perryville sits at the confluence of the Susquehanna River and the Chesapeake Bay, providing scenic waterfront access and recreational opportunities. The town has worked to develop its waterfront and attract visitors while serving as a residential community for families working throughout Cecil County and the I-95 corridor.' },
    ],
  },
  'pike-creek': {
    founded: '1960',
    population: '7,808',
    history: [
      { era: 'Post-War Growth', title: 'Suburban Development', description: 'Pike Creek is an unincorporated community in New Castle County, Delaware, that developed primarily in the 1960s and 1970s as suburban growth expanded west from Wilmington. Named for Pike Creek, a tributary of the Christina River, the area transformed from farmland into residential subdivisions and commercial centers.' },
      { era: 'Modern Era', title: 'Established Suburb', description: 'Pike Creek has matured into an established suburban community known for good schools and family-friendly neighborhoods. The Pike Creek Valley includes diverse housing options and the Limestone Road commercial corridor, serving as a residential hub between Wilmington and the rural communities of western New Castle County.' },
    ],
  },
  'pocopson': {
    founded: '1849',
    population: '4,582',
    history: [
      { era: 'Colonial Era', title: 'Lenape Heritage', description: 'Pocopson Township in Chester County takes its name from the Lenape word "pohkopson" meaning "roaring waters," likely referring to the sound of the Brandywine Creek that forms part of the township\'s boundary. The area was settled by English Quakers in the early 1700s.' },
      { era: 'Antebellum Era', title: 'Agricultural Community', description: 'Pocopson developed as a quiet agricultural township in the Brandywine Valley. The township was formed in 1849 from portions of Birmingham Township, and its rolling farmland and proximity to the Brandywine Creek defined its rural character throughout the 19th century.' },
      { era: 'Modern Era', title: 'Rural Preservation', description: 'Pocopson has worked to maintain its rural character amid development pressures in Chester County. The township is home to Pocopson Home, a historic county institution, and its landscape of preserved farmland, horse properties, and wooded hillsides reflects the Brandywine Valley\'s pastoral tradition.' },
    ],
  },
  'port-deposit': {
    founded: '1812',
    population: '614',
    history: [
      { era: 'Early Republic', title: 'River Port', description: 'Port Deposit developed as a crucial commercial port on the Susquehanna River in Cecil County, Maryland. The town was incorporated in 1812 and served as the southernmost navigable point on the Susquehanna, making it a vital transfer point for lumber, coal, and other goods floated downstream.' },
      { era: 'Industrial Age', title: 'Granite Quarrying', description: 'Port Deposit became famous for its granite quarries, which supplied stone for numerous significant buildings and structures. Port Deposit granite was used in the construction of the U.S. Capitol extension, the Philadelphia Custom House, and other important 19th-century buildings throughout the eastern United States.' },
      { era: 'Modern Era', title: 'Historic Town', description: 'Port Deposit\'s entire town is listed on the National Register of Historic Places. The dramatic setting of granite buildings climbing the steep hillside above the Susquehanna River makes it one of the most picturesque small towns in Maryland, attracting visitors interested in its architectural and industrial heritage.' },
    ],
  },
  'potomac': {
    founded: '1880',
    population: '47,018',
    history: [
      { era: 'Colonial Era', title: 'Agricultural Land', description: 'The Potomac area in Montgomery County, Maryland, was colonial farmland and plantation territory along the Potomac River. The region was part of larger land grants that included estates and tobacco farms during the 18th century.' },
      { era: 'Post-War Growth', title: 'Estate Development', description: 'Potomac began its transformation from rural farmland to an exclusive residential area after World War II. Large lots, estate-style homes, and equestrian properties attracted affluent families seeking privacy and space close to Washington, D.C., and many diplomatic residences and country clubs were established in the area.' },
      { era: 'Modern Era', title: 'Elite Community', description: 'Potomac is consistently ranked among the wealthiest communities in the United States, known for its large homes, excellent schools, and prestigious country clubs. The community\'s proximity to the nation\'s capital makes it home to many government officials, diplomats, and business leaders.' },
    ],
  },
  'quarryville': {
    founded: '1892',
    population: '2,556',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'The Quarryville area in southern Lancaster County was settled by Scots-Irish immigrants in the early 1700s. The community takes its name from the limestone quarries that were an important local industry, providing building materials for the surrounding region.' },
      { era: 'Industrial Age', title: 'Borough Incorporation', description: 'Quarryville was incorporated as a borough in 1892. The town served as a market center for the surrounding agricultural communities in the "garden spot" of Lancaster County, with the Solanco area known for its productive farmland and Amish and Mennonite communities.' },
      { era: 'Modern Era', title: 'Rural Borough', description: 'Quarryville maintains its character as a small rural borough in southern Lancaster County. The community is near the birthplace of Robert Fulton, inventor of the steamboat, and serves as the commercial center for the Solanco school district area. The Presbyterian Retirement Community, one of the largest continuing care facilities in the region, is located nearby.' },
    ],
  },
  'rising-sun': {
    founded: '1860',
    population: '2,781',
    history: [
      { era: 'Colonial Era', title: 'Tavern Origins', description: 'Rising Sun traces its name to a colonial-era tavern that served travelers along the main road through Cecil County, Maryland. The crossroads settlement developed as a small commercial center for the surrounding agricultural community in the northern part of the county near the Pennsylvania border.' },
      { era: 'Industrial Age', title: 'Town Incorporation', description: 'Rising Sun was incorporated in 1860 and developed as a quiet market town serving the farming communities of northern Cecil County. The town maintained its small-town character through the 19th and 20th centuries, centered around its main street commercial district.' },
      { era: 'Modern Era', title: 'Rural Town', description: 'Rising Sun remains a small, rural town in Cecil County that serves as a commercial center for the surrounding agricultural area. The community has preserved its historic character while adapting to serve as a bedroom community for workers commuting to larger employment centers along the I-95 corridor.' },
    ],
  },
  'rockledge': {
    founded: '1926',
    population: '2,638',
    history: [
      { era: 'Turn of the Century', title: 'Residential Development', description: 'Rockledge developed as a residential community in the early 1900s in Montgomery County, Pennsylvania, adjacent to the larger boroughs of Jenkintown and Abington. The area attracted middle-class families seeking suburban homes with access to Philadelphia via the railroad.' },
      { era: 'Early Twentieth Century', title: 'Borough Incorporation', description: 'Rockledge was incorporated as a borough in 1926, formalizing its separate identity from surrounding communities. The compact borough developed with modest homes along quiet residential streets, maintaining a close-knit community character.' },
      { era: 'Modern Era', title: 'Small Borough', description: 'Rockledge remains one of Montgomery County\'s smallest boroughs, with a quiet residential character. Its proximity to Jenkintown and regional rail service provides convenient access to Philadelphia and the broader suburban landscape of eastern Montgomery County.' },
    ],
  },
  'sharon-hill': {
    founded: '1890',
    population: '6,014',
    history: [
      { era: 'Victorian Origins', title: 'Borough Founding', description: 'Sharon Hill was incorporated as a borough in 1890 from portions of Darby Township in Delaware County. Named after a local estate, the community developed as a streetcar suburb providing homes for workers employed in Philadelphia and the industrial centers of Delaware County.' },
      { era: 'Early Twentieth Century', title: 'Residential Growth', description: 'Sharon Hill grew steadily in the early 20th century as trolley and later SEPTA transit connections made commuting to Philadelphia convenient. The borough filled with rowhouses and twin homes that gave it a dense, urban character typical of inner-ring Delaware County suburbs.' },
      { era: 'Modern Era', title: 'Diverse Community', description: 'Sharon Hill has become a diverse residential community in Delaware County. The borough\'s affordable housing stock and transit access continue to attract families, and community organizations work to maintain the quality of neighborhood life in this compact suburban borough.' },
    ],
  },
  'south-coatesville': {
    founded: '1921',
    population: '1,604',
    history: [
      { era: 'Turn of the Century', title: 'Borough Founding', description: 'South Coatesville was incorporated as a borough in 1921 from portions of Valley Township in Chester County. The community developed as a residential area adjacent to the larger city of Coatesville, with many residents working in the Lukens Steel Company and related industries.' },
      { era: 'Early Twentieth Century', title: 'Working-Class Community', description: 'South Coatesville grew as a working-class community closely tied to the fortunes of the steel industry. The borough\'s modest homes housed steelworkers and their families, creating a tight-knit community that shared the economic booms and busts of American steelmaking.' },
      { era: 'Modern Era', title: 'Small Borough', description: 'South Coatesville remains a small residential borough in the Brandywine Valley area of Chester County. While the decline of the steel industry has transformed the local economy, the borough maintains its community identity and benefits from its location in the growing western Chester County region.' },
    ],
  },
  'spring-city': {
    founded: '1867',
    population: '3,494',
    history: [
      { era: 'Industrial Age', title: 'Borough Founding', description: 'Spring City was incorporated as a borough in 1867 in Chester County, situated along the Schuylkill River and the railroad. The community developed around local industries including the famous Pennhurst State School, which later became one of the most controversial institutions in Pennsylvania\'s history.' },
      { era: 'Turn of the Century', title: 'Industrial Community', description: 'Spring City grew in the late 19th century as a small industrial town along the Schuylkill River valley. The borough\'s location on the railroad and river provided access to markets and raw materials, supporting local manufacturing and commerce.' },
      { era: 'Modern Era', title: 'Revitalization', description: 'Spring City has focused on revitalizing its historic downtown and waterfront areas. The borough\'s proximity to the Schuylkill River Trail and its stock of historic buildings have attracted new residents and businesses interested in the charm of a small Chester County river town.' },
    ],
  },
  'springfield': {
    founded: '1686',
    population: '24,211',
    history: [
      { era: 'Colonial Era', title: 'Early Settlement', description: 'Springfield Township in Delaware County was established in 1686, making it one of the oldest communities in Pennsylvania. The area was settled by English and Welsh Quakers who received land grants from William Penn and established farms in the rolling countryside west of Philadelphia.' },
      { era: 'Post-War Growth', title: 'Suburban Boom', description: 'Springfield experienced dramatic growth after World War II as suburban development transformed the former farmland. The construction of the Springfield Mall (now Springfield Town Center) in 1966 established the township as a major retail destination in Delaware County.' },
      { era: 'Modern Era', title: 'Suburban Community', description: 'Springfield is now a large, established suburban community in Delaware County known for its good schools, shopping centers, and residential neighborhoods. The township\'s central location provides easy access to Philadelphia, the airport, and major highways throughout the Delaware Valley.' },
    ],
  },
  'strasburg': {
    founded: '1793',
    population: '2,890',
    history: [
      { era: 'Colonial Era', title: 'French Huguenot Settlement', description: 'Strasburg was settled by French Huguenots in the early 1700s and named after Strasbourg, France. The borough, incorporated in 1793, developed as a small market town in southeastern Lancaster County, surrounded by the productive farmland of the Pennsylvania Dutch Country.' },
      { era: 'Industrial Age', title: 'Railroad Heritage', description: 'The Strasburg Rail Road, chartered in 1832, is the oldest continuously operating railroad in the Western Hemisphere. The short-line railroad connected Strasburg to the main Pennsylvania Railroad line, carrying passengers and freight until the mid-20th century.' },
      { era: 'Modern Era', title: 'Tourism Destination', description: 'Strasburg has become a premier tourist destination in Lancaster County, anchored by the restored Strasburg Rail Road, the Railroad Museum of Pennsylvania, and the Choo Choo Barn. The borough\'s location in the heart of Amish Country attracts visitors year-round to experience its railroad heritage and Pennsylvania Dutch culture.' },
    ],
  },
  'summerlin': {
    founded: '1990',
    population: '115,488',
    history: [
      { era: 'Late Twentieth Century', title: 'Master-Planned Community', description: 'Summerlin is a master-planned community in the western Las Vegas Valley, developed by the Howard Hughes Corporation beginning in 1990. Named after Jean Amelia Summerlin, the grandmother of Howard Hughes, the community was designed as a comprehensive residential development with villages, parks, and commercial centers nestled against the Spring Mountains.' },
      { era: 'Modern Era', title: 'Premier Suburb', description: 'Summerlin has grown into one of the most desirable communities in the Las Vegas metropolitan area, known for its extensive trail system, golf courses, and proximity to Red Rock Canyon National Conservation Area. The community continues to expand with new villages and the Downtown Summerlin mixed-use center, which has become a major retail and entertainment destination.' },
    ],
  },
  'surfside-beach': {
    founded: '1964',
    population: '4,470',
    history: [
      { era: 'Post-War Growth', title: 'Beach Town Founding', description: 'Surfside Beach was incorporated as a town in 1964 along the southern end of the Grand Strand in Horry County, South Carolina. The community developed as a family-friendly beach destination, distinguishing itself from the more commercialized Myrtle Beach to the north.' },
      { era: 'Modern Era', title: 'Family Beach Town', description: 'Surfside Beach has maintained its reputation as "The Family Beach," offering a quieter and more residential coastal experience than neighboring Myrtle Beach. The town features a popular pier, wide beaches, and a community-oriented atmosphere that attracts families seeking a relaxed coastal lifestyle on the Grand Strand.' },
    ],
  },
  'thorndale': {
    founded: '1850',
    population: '3,407',
    history: [
      { era: 'Industrial Age', title: 'Railroad Community', description: 'Thorndale developed as a small community in Caln Township, Chester County, centered around a stop on the Pennsylvania Railroad. The settlement served the surrounding agricultural area while providing convenient rail access to the larger cities of Coatesville and Philadelphia.' },
      { era: 'Modern Era', title: 'Growing Community', description: 'Thorndale has grown as part of the Coatesville-Downingtown corridor in Chester County. The community benefits from SEPTA regional rail service at the Thorndale station, which is the western terminus of the Paoli/Thorndale Line, making it a convenient commuter location for workers traveling to Philadelphia and its western suburbs.' },
    ],
  },
  'townsend': {
    founded: '1885',
    population: '2,717',
    history: [
      { era: 'Industrial Age', title: 'Railroad Town', description: 'Townsend developed as a small agricultural community and railroad stop in southern New Castle County, Delaware. The town was incorporated in 1885 and served as a market center for the farming communities between Middletown and the Chesapeake and Delaware Canal.' },
      { era: 'Modern Era', title: 'Growing Community', description: 'Townsend has experienced growth as part of the broader suburban expansion in southern New Castle County. New residential developments have attracted families from the Wilmington and Dover areas, while the town works to balance growth with preservation of its small-town character.' },
    ],
  },
  'unionville': {
    founded: '1740',
    population: '1,000',
    history: [
      { era: 'Colonial Era', title: 'Quaker Settlement', description: 'Unionville is a small village in East Marlborough Township, Chester County, settled by Quaker families in the mid-1700s. The community developed at a crossroads in the rolling hills of southern Chester County, surrounded by the agricultural landscape that continues to define the area.' },
      { era: 'Industrial Age', title: 'Equestrian Tradition', description: 'Unionville became known for its equestrian culture in the 19th century, with the surrounding countryside providing ideal terrain for fox hunting, steeplechase racing, and horse breeding. The tradition continues through events like the Winterthur Point-to-Point races held nearby.' },
      { era: 'Modern Era', title: 'Rural Preservation', description: 'Unionville is known for the highly regarded Unionville-Chadds Ford School District and its commitment to preserving the rural character of southern Chester County. The area\'s equestrian estates, preserved farmland, and Brandywine Valley scenery make it one of the most distinctive communities in the greater Philadelphia region.' },
    ],
  },
};

function run() {
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [slug, data] of Object.entries(HISTORY_DATA)) {
    const filePath = path.join(OUT_DIR, `${slug}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ${slug}: file not found, skipping`);
      notFound++;
      continue;
    }

    const wikiData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Only update if history is empty
    if (wikiData.history && wikiData.history.length > 0) {
      console.log(`  ${slug}: already has ${wikiData.history.length} history entries, skipping`);
      skipped++;
      continue;
    }

    // Update history
    wikiData.history = data.history;

    // Update founded and population if we have better data
    if (data.founded && !wikiData.founded) wikiData.founded = data.founded;
    if (data.population && !wikiData.population) wikiData.population = data.population;

    wikiData.generatedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(wikiData, null, 2));
    updated++;
    console.log(`  ${slug}: UPDATED — ${data.history.length} history entries added`);
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped (already had history), ${notFound} not found.`);
}

run();
