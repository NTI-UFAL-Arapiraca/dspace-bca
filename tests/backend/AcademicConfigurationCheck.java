import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.dspace.discovery.configuration.DiscoveryConfiguration;
import org.dspace.discovery.configuration.DiscoveryConfigurationParameters;
import org.dspace.discovery.configuration.DiscoveryConfigurationService;
import org.dspace.discovery.configuration.DiscoverySearchFilterFacet;
import org.dspace.discovery.configuration.DiscoverySortFieldConfiguration;
import org.springframework.beans.factory.xml.XmlBeanDefinitionReader;
import org.springframework.context.support.GenericApplicationContext;
import org.xml.sax.SAXParseException;
import org.xml.sax.helpers.DefaultHandler;

/** Validate the real 10.1 DTOs/Spring wiring and DTDs without a database. */
public class AcademicConfigurationCheck {
    public static void main(String[] args) throws Exception {
        var factory = DocumentBuilderFactory.newInstance();
        factory.setValidating(true);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "file");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        var parser = factory.newDocumentBuilder();
        parser.setErrorHandler(new DefaultHandler() {
            @Override public void error(SAXParseException error) throws SAXParseException { throw error; }
            @Override public void fatalError(SAXParseException error) throws SAXParseException { throw error; }
        });
        parser.parse(Path.of("/dspace/config/submission-forms.xml").toFile());
        parser.parse(Path.of("/dspace/config/item-submission.xml").toFile());

        try (var context = new GenericApplicationContext()) {
            var service = new DiscoveryConfigurationService();
            Map<String, DiscoveryConfiguration> original = new HashMap<>();
            var defaultConfig = new DiscoveryConfiguration();
            original.put("default", defaultConfig);
            service.setMap(original);
            context.getBeanFactory().registerSingleton(
                "org.dspace.discovery.configuration.DiscoveryConfigurationService", service);
            for (String name : new String[]{"Title", "Author", "Issued", "Subject", "Type"}) {
                context.getBeanFactory().registerSingleton("searchFilter" + name, new DiscoverySearchFilterFacet());
            }
            context.getBeanFactory().registerSingleton("sortDateIssued", new DiscoverySortFieldConfiguration());
            context.getBeanFactory().registerSingleton("sortTitleAsc", new DiscoverySortFieldConfiguration());
            context.getBeanFactory().registerSingleton("sortDateAccessioned", new DiscoverySortFieldConfiguration());
            new XmlBeanDefinitionReader(context).loadBeanDefinitions(
                "file:/dspace/config/spring/api/academic-discovery.xml");
            context.refresh();
            if (service.getMap().get("default") != defaultConfig) {
                throw new AssertionError("The upstream discovery configuration was replaced");
            }
            for (String role : new String[]{"works", "authored", "advised", "coadvised", "reviewed"}) {
                String id = "RELATION.Person." + role;
                if (!service.getMap().containsKey(id) || !id.equals(service.getMap().get(id).getId())) {
                    throw new AssertionError("Missing discovery registration: " + id);
                }
            }
            DiscoveryConfiguration aggregates = service.getMap().get("academic_works_aggregates");
            if (aggregates == null || !"academic_works_aggregates".equals(aggregates.getId())
                || !aggregates.isIndexAlways()) {
                throw new AssertionError("Missing indexed discovery registration: academic_works_aggregates");
            }
            DiscoverySearchFilterFacet year = aggregates.getSidebarFacet("publicationYear");
            if (year == null || !"text".equals(year.getType())
                || !year.getMetadataFields().equals(java.util.List.of("dc.date.issued"))
                || year.getFacetLimit() != 100
                || year.getSortOrderSidebar() != DiscoveryConfigurationParameters.SORT.VALUE) {
                throw new AssertionError("publicationYear must be a text facet over dc.date.issued sorted by value");
            }
            DiscoveryConfiguration works = service.getMap().get("academic_works_search");
            if (works.getSidebarFacet("publicationYear") != null) {
                throw new AssertionError("publicationYear must stay out of the public search sidebar");
            }
            DiscoverySearchFilterFacet cnpq = works.getSidebarFacet("cnpq");
            if (cnpq == null || !cnpq.getMetadataFields().equals(java.util.List.of("local.cnpq.area"))) {
                throw new AssertionError("The public works search must facet local.cnpq.area as cnpq");
            }
            for (DiscoveryConfiguration config : new DiscoveryConfiguration[]{works, aggregates}) {
                if (config.getDefaultFilterQueries().stream().noneMatch(q -> q.contains("-entityType_keyword:Person"))) {
                    throw new AssertionError("Works configurations must exclude Person profiles: " + config.getId());
                }
            }
        }
        System.out.println("Academic forms, DTDs and discovery registration validated against DSpace 10.1.");
    }
}
