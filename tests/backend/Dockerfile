FROM docker.io/dspace/dspace-cli:dspace-10.1
COPY backend/config/ /dspace/config/
COPY tests/backend/AcademicConfigurationCheck.java /checks/AcademicConfigurationCheck.java
RUN test "$(/dspace/bin/dspace dsprop -p relationship.enable-virtual-metadata)" = false
RUN /dspace/bin/dspace dsprop -p plugin.named.org.dspace.content.authority.ChoiceAuthority
RUN /dspace/bin/dspace dsprop -p rest.properties.exposed
RUN java -cp '/dspace/lib/*' /checks/AcademicConfigurationCheck.java
