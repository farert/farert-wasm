<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" }]];
</script>

<Icon name="crown" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
